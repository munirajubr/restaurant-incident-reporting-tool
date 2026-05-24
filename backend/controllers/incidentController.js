const Incident = require('../models/Incident');
const { IncidentFallback } = require('../services/dbFallback');

// @desc    Create a new incident report
// @route   POST /api/incidents
// @access  Private (Staff & Manager)
exports.createIncident = async (req, res) => {
  try {
    const { title, category, description, storeLocation, severity, dateTime, image } = req.body;

    // Validate fields
    if (!title || !category || !description || !storeLocation || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields (title, category, description, storeLocation, severity)'
      });
    }

    const incidentData = {
      title,
      category,
      description,
      storeLocation,
      severity,
      dateTime: dateTime || new Date(),
      reporter: req.user._id, // Set reporter to logged-in user
      status: 'Open',
      image: image || ''
    };

    let incident;
    if (process.env.USE_MOCK_DB === 'true') {
      incident = await IncidentFallback.create(incidentData);
    } else {
      incident = await Incident.create(incidentData);
    }

    return res.status(201).json({
      success: true,
      data: incident
    });

  } catch (error) {
    console.error('Create Incident Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error creating incident report'
    });
  }
};

// @desc    Get all incidents (with filters and search)
// @route   GET /api/incidents
// @access  Private (Staff see their store, Managers see all)
exports.getIncidents = async (req, res) => {
  try {
    const { category, severity, status, storeLocation, search } = req.query;

    // Set up filter object
    const filter = {};

    // Enforce location security: Staff only see their own store's incidents
    if (req.user.role !== 'manager') {
      filter.storeLocation = req.user.storeLocation;
    } else if (storeLocation) {
      // Manager filtering by specific store
      filter.storeLocation = storeLocation;
    }

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    let incidents;

    if (process.env.USE_MOCK_DB === 'true') {
      // Include search in fallback query
      if (search) filter.search = search;
      incidents = await IncidentFallback.find(filter);
    } else {
      // Add text search to MongoDB query if search term is provided
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Query database
      incidents = await Incident.find(filter)
        .populate('reporter', 'name email role storeLocation')
        .populate('resolvedBy', 'name email')
        .sort({ dateTime: -1 }); // Latest incidents first
    }

    // Pin Active Critical incidents (Open or In Progress) to the top
    incidents.sort((a, b) => {
      const aActiveCritical = (a.severity === 'Critical' && a.status !== 'Resolved' && a.status !== 'Closed') ? 1 : 0;
      const bActiveCritical = (b.severity === 'Critical' && b.status !== 'Resolved' && b.status !== 'Closed') ? 1 : 0;

      if (aActiveCritical !== bActiveCritical) {
        return bActiveCritical - aActiveCritical; // Active critical first
      }

      return new Date(b.dateTime) - new Date(a.dateTime); // Secondary sort by date descending
    });

    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });

  } catch (error) {
    console.error('Get Incidents Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error retrieving incidents'
    });
  }
};

// @desc    Get single incident details
// @route   GET /api/incidents/:id
// @access  Private
exports.getIncidentById = async (req, res) => {
  try {
    const incidentId = req.params.id;
    let incident;

    if (process.env.USE_MOCK_DB === 'true') {
      incident = await IncidentFallback.findById(incidentId);
    } else {
      incident = await Incident.findById(incidentId)
        .populate('reporter', 'name email role storeLocation')
        .populate('resolvedBy', 'name email');
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Access control: Staff can only view their own store's incidents
    const incidentStore = incident.storeLocation;
    if (req.user.role !== 'manager' && incidentStore !== req.user.storeLocation) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view reports from other store locations'
      });
    }

    return res.status(200).json({
      success: true,
      data: incident
    });

  } catch (error) {
    console.error('Get Incident By ID Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error retrieving incident details'
    });
  }
};

// @desc    Update incident status and add manager notes
// @route   PATCH /api/incidents/:id
// @access  Private (Manager only)
exports.updateIncidentStatus = async (req, res) => {
  try {
    const incidentId = req.params.id;
    const { status, managerNotes, resolutionActions } = req.body;

    // Validation
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a status to update'
      });
    }

    // Check if incident exists
    let incident;
    if (process.env.USE_MOCK_DB === 'true') {
      incident = await IncidentFallback.findById(incidentId);
    } else {
      incident = await Incident.findById(incidentId);
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    const updates = { status };
    if (managerNotes !== undefined) {
      updates.managerNotes = managerNotes;
      updates.managerName = req.user.name;
      updates.managerStore = req.user.storeLocation;
      updates.managerRole = req.user.role === 'manager' ? 'Store Manager' : req.user.role;
    }
    if (resolutionActions !== undefined) {
      updates.resolutionActions = resolutionActions;
      updates.managerName = req.user.name;
      updates.managerStore = req.user.storeLocation;
      updates.managerRole = req.user.role === 'manager' ? 'Store Manager' : req.user.role;
    }

    // Track resolution details
    if (status === 'Resolved' || status === 'Closed') {
      updates.resolvedAt = new Date();
      updates.resolvedBy = req.user._id;
    } else {
      // If changing back, clear resolution
      updates.resolvedAt = null;
      updates.resolvedBy = null;
    }

    let updatedIncident;
    if (process.env.USE_MOCK_DB === 'true') {
      updatedIncident = await IncidentFallback.findByIdAndUpdate(incidentId, updates);
    } else {
      updatedIncident = await Incident.findByIdAndUpdate(incidentId, updates, {
        new: true,
        runValidators: true
      })
        .populate('reporter', 'name email role storeLocation')
        .populate('resolvedBy', 'name email');
    }

    return res.status(200).json({
      success: true,
      data: updatedIncident
    });

  } catch (error) {
    console.error('Update Incident Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error updating incident status'
    });
  }
};

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private (Manager only)
exports.deleteIncident = async (req, res) => {
  try {
    const incidentId = req.params.id;
    let incident;

    if (process.env.USE_MOCK_DB === 'true') {
      incident = await IncidentFallback.findById(incidentId);
    } else {
      incident = await Incident.findById(incidentId);
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    if (process.env.USE_MOCK_DB === 'true') {
      await IncidentFallback.findByIdAndDelete(incidentId);
    } else {
      await Incident.findByIdAndDelete(incidentId);
    }

    return res.status(200).json({
      success: true,
      message: 'Incident deleted successfully'
    });

  } catch (error) {
    console.error('Delete Incident Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error deleting incident'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/incidents/stats
// @access  Private (Staff sees their store, Managers see all)
exports.getIncidentStats = async (req, res) => {
  try {
    const filter = {};
    // Staff stats restricted to their store location
    if (req.user.role !== 'manager') {
      filter.storeLocation = req.user.storeLocation;
    }

    let incidents;
    if (process.env.USE_MOCK_DB === 'true') {
      incidents = await IncidentFallback.find(filter);
    } else {
      incidents = await Incident.find(filter);
    }

    // Calculations
    const total = incidents.length;
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let closedCount = 0;
    let criticalCount = 0;

    const categoryBreakdown = {};
    const severityBreakdown = {};
    const statusBreakdown = {};

    incidents.forEach(inc => {
      // Status aggregates
      if (inc.status === 'Open') openCount++;
      else if (inc.status === 'In Progress') inProgressCount++;
      else if (inc.status === 'Resolved') resolvedCount++;
      else if (inc.status === 'Closed') closedCount++;

      // Critical count
      if (inc.severity === 'Critical') criticalCount++;

      // Category breakdown
      categoryBreakdown[inc.category] = (categoryBreakdown[inc.category] || 0) + 1;

      // Severity breakdown
      severityBreakdown[inc.severity] = (severityBreakdown[inc.severity] || 0) + 1;

      // Status breakdown
      statusBreakdown[inc.status] = (statusBreakdown[inc.status] || 0) + 1;
    });

    const activeCount = openCount + inProgressCount;
    const closedResolvedCount = resolvedCount + closedCount;
    const resolutionRate = total > 0 ? Math.round((closedResolvedCount / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        active: activeCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        critical: criticalCount,
        resolutionRate,
        categoryBreakdown,
        severityBreakdown,
        statusBreakdown
      }
    });

  } catch (error) {
    console.error('Get Stats Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error compiling incident analytics statistics'
    });
  }
};

// @desc    Generate resolution solution using Google Gemini AI
// @route   POST /api/incidents/:id/ai-solution
// @access  Private (Authenticated users)
exports.generateAiSolution = async (req, res) => {
  try {
    const incidentId = req.params.id;

    // 1. Fetch the incident
    let incident;
    if (process.env.USE_MOCK_DB === 'true') {
      incident = await IncidentFallback.findById(incidentId);
    } else {
      incident = await Incident.findById(incidentId);
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // 2. Validate API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY inside environment variables!');
      return res.status(500).json({
        success: false,
        error: 'AI service is temporarily unavailable. Missing API Key configuration.'
      });
    }

    // 3. Craft Prompt for Gemini Flash Model
    const systemInstruction = "You are an expert Restaurant Operations Consultant and AI Assistant. Analyze the operational incident reported in a restaurant/store branch and generate a highly structured, professional, step-by-step resolution plan and preventative measures. Keep the tone professional, authoritative, and helpful. in simple language that can be easily understood by restaurant staff and management. Focus on actionable insights and clear guidance to resolve the issue and prevent future occurrences and in short (maximum 20 lines) without losing critical details. Always consider the severity and category of the incident when formulating your response. and give me direct Incident Resolution Plan"   ;

    const promptText = `${systemInstruction}
    
Incident Details:
- Title: ${incident.title}
- Category: ${incident.category}
- Severity: ${incident.severity}
- Store Location: ${incident.storeLocation}
- Description: ${incident.description}

Please provide your output in a clear, professional layout. Use bullet points and clear sections:
1. Immediate Action Plan (3-4 critical steps to mitigate the current issue immediately)
2. Root Cause Analysis (Briefly analyze why this might have occurred)
3. Preventative Actions (Step-by-step measures to prevent this issue from recurring)
4. Recommended Operations Tools (Specific restaurant tools or checklists to deploy)`;

    // 4. Fire API Request using native Node.js fetch with fallback models
    console.log(`[AI] Generating solution for incident: ${incidentId} using Gemini...`);
    
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let apiResponse = null;
    let selectedModel = '';
    let lastError = '';

    for (const modelName of candidateModels) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      console.log(`[AI] Attempting AI generation with model: ${modelName}`);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ]
          })
        });

        if (response.ok) {
          apiResponse = response;
          selectedModel = modelName;
          break;
        } else {
          const errText = await response.text();
          console.warn(`[AI] Model ${modelName} returned status ${response.status}: ${errText}`);
          lastError = errText;
        }
      } catch (err) {
        console.error(`[AI] Connection error with model ${modelName}:`, err);
        lastError = err.message;
      }
    }

    if (!apiResponse) {
      console.error(`Gemini API Error Response (all models failed):`, lastError);
      return res.status(502).json({
        success: false,
        error: 'Failed to communicate with AI generative services. All candidate models failed.'
      });
    }

    console.log(`[AI] Gemini AI successfully generated content using model: ${selectedModel}`);
    const apiData = await apiResponse.json();
    
    // 5. Extract text from Gemini structure
    let aiText = '';
    try {
      aiText = apiData.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error('Failed to parse Gemini API JSON candidates:', e, JSON.stringify(apiData));
      return res.status(502).json({
        success: false,
        error: 'Received empty or unparseable payload from AI service.'
      });
    }

    // 6. Persist to database
    let updatedIncident;
    if (process.env.USE_MOCK_DB === 'true') {
      updatedIncident = await IncidentFallback.findByIdAndUpdate(incidentId, {
        aiSolution: aiText
      });
    } else {
      updatedIncident = await Incident.findByIdAndUpdate(incidentId, {
        aiSolution: aiText
      }, {
        new: true,
        runValidators: true
      })
      .populate('reporter', 'name email role storeLocation')
      .populate('resolvedBy', 'name email');
    }

    return res.status(200).json({
      success: true,
      data: updatedIncident
    });

  } catch (error) {
    console.error('AI Generation Incident Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error compiling AI incident analysis.'
    });
  }
};
