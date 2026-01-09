<<<<<<< Updated upstream
// src/lib/sabian/uraSabian.ts
// URA Degree Symbol Reference (Hand-authored / generated template)
// NOTE: These entries are ORIGINAL URA text (not canonical Sabian phrases).
// You can later replace individual entries with closer rewrites as you refine doctrine.

export type UraSabianEntry = {
  idx: number;
  key: string;
  sign: string;
  degree: number;
  symbol: string;
  signal: string;
  shadow: string;
  directive: string;
  practice: string;
  journal: string;
  tags?: string[];
};

export const URA_SABIAN: UraSabianEntry[] = [
  {
    "idx": 0,
    "key": "Aries 1",
    "sign": "Aries",
    "degree": 1,
    "symbol": "Start: A decisive action moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize initiate.",
    "shadow": "Rushing creates rework. Watch for impulsiveness.",
    "directive": "Start small and make it real. Keep it decisive action.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "focus",
      "start",
      "initiate"
    ]
  },
  {
    "idx": 1,
    "key": "Aries 2",
    "sign": "Aries",
    "degree": 2,
    "symbol": "Choice: A decisive action moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize initiate.",
    "shadow": "Keeping both dilutes effort. Watch for impulsiveness.",
    "directive": "Pick one lane and commit. Keep it decisive action.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "focus",
      "initiate"
=======
export const URA_SABIAN = [
  null,
  {
    "idx": 1,
    "key": "Aries_25",
    "sign": "Aries",
    "degree": 25,
    "symbol": "A warrior preparing for battle.",
    "signal": "Courage and readiness to confront challenges.",
    "shadow": "Impulsiveness leading to reckless actions.",
    "directive": "Embrace your inner strength and prepare for upcoming challenges with a clear strategy.",
    "practice": "Spend time visualizing your goals and the steps needed to achieve them, focusing on both preparation and execution.",
    "journal": "What challenges am I currently facing, and how can I prepare myself to overcome them?",
    "tags": [
      "courage",
      "preparation",
      "strategy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 2,
<<<<<<< Updated upstream
    "key": "Aries 3",
    "sign": "Aries",
    "degree": 3,
    "symbol": "Signal: A decisive action moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize initiate.",
    "shadow": "Noise hides the point. Watch for impulsiveness.",
    "directive": "Name the signal and ignore the rest. Keep it decisive action.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "focus",
      "initiate",
      "signal"
=======
    "key": "Aries_26",
    "sign": "Aries",
    "degree": 26,
    "symbol": "A group of people in a circle, sharing stories.",
    "signal": "The power of community and shared experiences.",
    "shadow": "Isolation and neglecting the support of others.",
    "directive": "Engage with your community and share your experiences to foster connection.",
    "practice": "Organize or participate in a gathering where stories and insights can be shared openly.",
    "journal": "How can I strengthen my connections with others and share my experiences more openly?",
    "tags": [
      "community",
      "connection",
      "storytelling"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 3,
<<<<<<< Updated upstream
    "key": "Aries 4",
    "sign": "Aries",
    "degree": 4,
    "symbol": "Structure: A decisive action moment is on the table.",
    "signal": "A stable frame is needed. Emphasize initiate.",
    "shadow": "Improvisation without a base collapses. Watch for impulsiveness.",
    "directive": "Build the container first. Keep it decisive action.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "focus",
      "structure",
      "initiate"
=======
    "key": "Aries_27",
    "sign": "Aries",
    "degree": 27,
    "symbol": "A phoenix rising from the ashes.",
    "signal": "Transformation and renewal after hardship.",
    "shadow": "Fear of change and clinging to the past.",
    "directive": "Embrace the changes in your life as opportunities for growth and rebirth.",
    "practice": "Identify areas in your life that need transformation and take actionable steps towards renewal.",
    "journal": "What aspects of my life need to be transformed, and how can I initiate this change?",
    "tags": [
      "transformation",
      "renewal",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 4,
<<<<<<< Updated upstream
    "key": "Aries 5",
    "sign": "Aries",
    "degree": 5,
    "symbol": "Craft: A decisive action moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize initiate.",
    "shadow": "Overthinking delays practice. Watch for impulsiveness.",
    "directive": "Practice the fundamentals. Keep it decisive action.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "focus",
      "initiate"
=======
    "key": "Aries_28",
    "sign": "Aries",
    "degree": 28,
    "symbol": "A lighthouse guiding ships at sea.",
    "signal": "Providing guidance and clarity to others.",
    "shadow": "Neglecting your own needs while helping others.",
    "directive": "Be a source of light for those around you, while ensuring your own path is clear.",
    "practice": "Reflect on how you can offer support to others without losing sight of your own goals.",
    "journal": "In what ways can I be a guiding light for others while also prioritizing my own journey?",
    "tags": [
      "guidance",
      "support",
      "clarity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 5,
<<<<<<< Updated upstream
    "key": "Aries 6",
    "sign": "Aries",
    "degree": 6,
    "symbol": "Order: A decisive action moment is on the table.",
    "signal": "Details want sorting. Emphasize initiate.",
    "shadow": "Perfectionism blocks delivery. Watch for impulsiveness.",
    "directive": "Organize, then ship. Keep it decisive action.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "focus",
      "order",
      "initiate"
=======
    "key": "Aries_29",
    "sign": "Aries",
    "degree": 29,
    "symbol": "A mountain climber reaching the summit.",
    "signal": "Achievement and the culmination of efforts.",
    "shadow": "Fear of failure or the pressure of expectations.",
    "directive": "Celebrate your achievements and recognize the effort it took to reach your goals.",
    "practice": "Take time to acknowledge your successes, big or small, and plan your next steps forward.",
    "journal": "What achievements am I proud of, and how can I build on them moving forward?",
    "tags": [
      "achievement",
      "success",
      "celebration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 6,
<<<<<<< Updated upstream
    "key": "Aries 7",
    "sign": "Aries",
    "degree": 7,
    "symbol": "Terms: A decisive action moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize initiate.",
    "shadow": "Avoiding terms breeds friction. Watch for impulsiveness.",
    "directive": "State expectations plainly. Keep it decisive action.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "focus",
      "terms",
      "initiate"
=======
    "key": "Aries_30",
    "sign": "Aries",
    "degree": 30,
    "symbol": "A new dawn breaking over the horizon.",
    "signal": "New beginnings and fresh opportunities.",
    "shadow": "Resistance to change and fear of the unknown.",
    "directive": "Embrace the potential of new beginnings and let go of what no longer serves you.",
    "practice": "Set intentions for what you want to manifest in this new phase of your life.",
    "journal": "What new beginnings am I ready to embrace, and what do I need to release to move forward?",
    "tags": [
      "new beginnings",
      "opportunity",
      "intention"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 7,
<<<<<<< Updated upstream
    "key": "Aries 8",
    "sign": "Aries",
    "degree": 8,
    "symbol": "Depth: A decisive action moment is on the table.",
    "signal": "A hidden factor matters. Emphasize initiate.",
    "shadow": "Control replaces honesty. Watch for impulsiveness.",
    "directive": "Confront the real issue. Keep it decisive action.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "focus",
      "depth",
      "initiate"
=======
    "key": "Taurus_1",
    "sign": "Taurus",
    "degree": 1,
    "symbol": "A seed germinating in the soil.",
    "signal": "Potential and the beginnings of growth.",
    "shadow": "Stagnation and fear of taking the first step.",
    "directive": "Nurture your ideas and allow them to take root in your life.",
    "practice": "Identify a new project or idea and take the first step to bring it to life.",
    "journal": "What new idea or project am I ready to nurture and grow?",
    "tags": [
      "potential",
      "growth",
      "nurturing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 8,
<<<<<<< Updated upstream
    "key": "Aries 9",
    "sign": "Aries",
    "degree": 9,
    "symbol": "Aim: A decisive action moment is on the table.",
    "signal": "A goal needs meaning. Emphasize initiate.",
    "shadow": "Drift wastes time. Watch for impulsiveness.",
    "directive": "Choose direction. Keep it decisive action.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "focus",
      "initiate"
=======
    "key": "Taurus_2",
    "sign": "Taurus",
    "degree": 2,
    "symbol": "A beautiful garden in full bloom.",
    "signal": "Abundance and the rewards of hard work.",
    "shadow": "Taking abundance for granted and neglecting maintenance.",
    "directive": "Appreciate the fruits of your labor and invest time in maintaining what you have.",
    "practice": "Create a gratitude list focusing on what you have achieved and how to sustain it.",
    "journal": "What abundance do I currently have in my life, and how can I cultivate it further?",
    "tags": [
      "abundance",
      "gratitude",
      "maintenance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 9,
<<<<<<< Updated upstream
    "key": "Aries 10",
    "sign": "Aries",
    "degree": 10,
    "symbol": "Ledger: A decisive action moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize initiate.",
    "shadow": "Self-worth ties to output. Watch for impulsiveness.",
    "directive": "Measure and adjust. Keep it decisive action.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "ledger",
      "stewardship",
      "initiate"
=======
    "key": "Taurus_3",
    "sign": "Taurus",
    "degree": 3,
    "symbol": "A craftsman at work, creating a masterpiece.",
    "signal": "Skill and dedication in the pursuit of excellence.",
    "shadow": "Perfectionism leading to frustration and burnout.",
    "directive": "Focus on honing your skills and take pride in the process of creation.",
    "practice": "Dedicate time to a craft or skill you wish to improve, allowing for mistakes as part of the journey.",
    "journal": "What skill am I passionate about developing, and how can I enjoy the process of learning?",
    "tags": [
      "skill",
      "craftsmanship",
      "dedication"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 10,
<<<<<<< Updated upstream
    "key": "Aries 11",
    "sign": "Aries",
    "degree": 11,
    "symbol": "Network: A decisive action moment is on the table.",
    "signal": "Support systems matter. Emphasize initiate.",
    "shadow": "Isolation becomes a habit. Watch for impulsiveness.",
    "directive": "Share the plan. Keep it decisive action.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "focus",
      "network",
      "initiate"
=======
    "key": "Taurus_4",
    "sign": "Taurus",
    "degree": 4,
    "symbol": "A sturdy tree providing shelter.",
    "signal": "Stability and support for others.",
    "shadow": "Overextending yourself to the detriment of your own stability.",
    "directive": "Be a source of support for others while ensuring your own foundation is strong.",
    "practice": "Evaluate your boundaries and ensure you are not sacrificing your own needs for others.",
    "journal": "How can I provide support to others while maintaining my own stability?",
    "tags": [
      "support",
      "stability",
      "boundaries"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 11,
<<<<<<< Updated upstream
    "key": "Aries 12",
    "sign": "Aries",
    "degree": 12,
    "symbol": "Reset: A decisive action moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize initiate.",
    "shadow": "Escaping replaces rest. Watch for impulsiveness.",
    "directive": "Pause and return with intent. Keep it decisive action.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "focus",
      "reset",
      "initiate"
=======
    "key": "Taurus_5",
    "sign": "Taurus",
    "degree": 5,
    "symbol": "A river flowing steadily.",
    "signal": "Consistency and the natural flow of life.",
    "shadow": "Resistance to change and rigidity in routines.",
    "directive": "Embrace the flow of life and allow for flexibility in your plans.",
    "practice": "Identify areas where you can be more adaptable and go with the flow.",
    "journal": "What aspects of my life feel rigid, and how can I introduce more flexibility?",
    "tags": [
      "consistency",
      "flow",
      "adaptability"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 12,
<<<<<<< Updated upstream
    "key": "Aries 13",
    "sign": "Aries",
    "degree": 13,
    "symbol": "Commit: A decisive action moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize initiate.",
    "shadow": "Half-commitment drains energy. Watch for impulsiveness.",
    "directive": "Commit fully. Keep it decisive action.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "focus",
      "commit",
      "initiate"
    ]
  },
  {
    "idx": 13,
    "key": "Aries 14",
    "sign": "Aries",
    "degree": 14,
    "symbol": "Boundaries: A decisive action moment is on the table.",
    "signal": "Limits protect value. Emphasize initiate.",
    "shadow": "Saying yes too fast costs you. Watch for impulsiveness.",
    "directive": "Set a boundary. Keep it decisive action.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 14,
    "key": "Aries 15",
    "sign": "Aries",
    "degree": 15,
    "symbol": "Mirror: A decisive action moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize initiate.",
    "shadow": "Defensiveness blocks learning. Watch for impulsiveness.",
    "directive": "Take the note. Keep it decisive action.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 15,
    "key": "Aries 16",
    "sign": "Aries",
    "degree": 16,
    "symbol": "Repair: A decisive action moment is on the table.",
    "signal": "Something wants fixing. Emphasize initiate.",
    "shadow": "Avoidance compounds cost. Watch for impulsiveness.",
    "directive": "Repair it. Keep it decisive action.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "focus",
      "initiate",
      "repair"
    ]
  },
  {
    "idx": 16,
    "key": "Aries 17",
    "sign": "Aries",
    "degree": 17,
    "symbol": "Focus: A decisive action moment is on the table.",
    "signal": "Attention is currency. Emphasize initiate.",
    "shadow": "Multitasking reduces quality. Watch for impulsiveness.",
    "directive": "Single-task. Keep it decisive action.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 17,
    "key": "Aries 18",
    "sign": "Aries",
    "degree": 18,
    "symbol": "Standard: A decisive action moment is on the table.",
    "signal": "Quality needs definition. Emphasize initiate.",
    "shadow": "Vague standards create stress. Watch for impulsiveness.",
    "directive": "Define the standard. Keep it decisive action.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "focus",
      "initiate",
      "standard"
    ]
  },
  {
    "idx": 18,
    "key": "Aries 19",
    "sign": "Aries",
    "degree": 19,
    "symbol": "Tempo: A decisive action moment is on the table.",
    "signal": "Timing matters. Emphasize initiate.",
    "shadow": "Forcing pace breaks form. Watch for impulsiveness.",
    "directive": "Set the pace. Keep it decisive action.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "focus",
      "tempo",
      "initiate"
    ]
  },
  {
    "idx": 19,
    "key": "Aries 20",
    "sign": "Aries",
    "degree": 20,
    "symbol": "Risk: A decisive action moment is on the table.",
    "signal": "A calculated step is required. Emphasize initiate.",
    "shadow": "Impulse risk is not courage. Watch for impulsiveness.",
    "directive": "Take a measured risk. Keep it decisive action.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "focus",
      "risk",
      "initiate"
    ]
  },
  {
    "idx": 20,
    "key": "Aries 21",
    "sign": "Aries",
    "degree": 21,
    "symbol": "Integration: A decisive action moment is on the table.",
    "signal": "Pieces want alignment. Emphasize initiate.",
    "shadow": "Fragmentation creates fatigue. Watch for impulsiveness.",
    "directive": "Integrate. Keep it decisive action.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 21,
    "key": "Aries 22",
    "sign": "Aries",
    "degree": 22,
    "symbol": "Authority: A decisive action moment is on the table.",
    "signal": "Own responsibility. Emphasize initiate.",
    "shadow": "Blame delays progress. Watch for impulsiveness.",
    "directive": "Take ownership. Keep it decisive action.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "focus",
      "authority",
      "initiate"
    ]
  },
  {
    "idx": 22,
    "key": "Aries 23",
    "sign": "Aries",
    "degree": 23,
    "symbol": "Refine: A decisive action moment is on the table.",
    "signal": "Polish after completion. Emphasize initiate.",
    "shadow": "Editing before finishing stalls. Watch for impulsiveness.",
    "directive": "Refine the finished draft. Keep it decisive action.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 23,
    "key": "Aries 24",
    "sign": "Aries",
    "degree": 24,
    "symbol": "Stewardship: A decisive action moment is on the table.",
    "signal": "Resources need care. Emphasize initiate.",
    "shadow": "Waste hides in habits. Watch for impulsiveness.",
    "directive": "Protect resources. Keep it decisive action.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "stewardship",
      "initiate"
    ]
  },
  {
    "idx": 24,
    "key": "Aries 25",
    "sign": "Aries",
    "degree": 25,
    "symbol": "Signal-to-noise: A decisive action moment is on the table.",
    "signal": "Simplify inputs. Emphasize initiate.",
    "shadow": "Overconsumption clouds judgment. Watch for impulsiveness.",
    "directive": "Reduce intake. Keep it decisive action.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 25,
    "key": "Aries 26",
    "sign": "Aries",
    "degree": 26,
    "symbol": "Sustain: A decisive action moment is on the table.",
    "signal": "Make it last. Emphasize initiate.",
    "shadow": "Burnout follows spikes. Watch for impulsiveness.",
    "directive": "Sustain. Keep it decisive action.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "focus",
      "sustain",
      "initiate"
    ]
  },
  {
    "idx": 26,
    "key": "Aries 27",
    "sign": "Aries",
    "degree": 27,
    "symbol": "Legacy: A decisive action moment is on the table.",
    "signal": "Long-term view matters. Emphasize initiate.",
    "shadow": "Short-term ego derails. Watch for impulsiveness.",
    "directive": "Think long. Keep it decisive action.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "legacy",
      "stewardship",
      "initiate"
    ]
  },
  {
    "idx": 27,
    "key": "Aries 28",
    "sign": "Aries",
    "degree": 28,
    "symbol": "Closure: A decisive action moment is on the table.",
    "signal": "Finish cycles. Emphasize initiate.",
    "shadow": "Open loops drain attention. Watch for impulsiveness.",
    "directive": "Close the loop. Keep it decisive action.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 28,
    "key": "Aries 29",
    "sign": "Aries",
    "degree": 29,
    "symbol": "Threshold: A decisive action moment is on the table.",
    "signal": "A transition is near. Emphasize initiate.",
    "shadow": "Hesitation creates drift. Watch for impulsiveness.",
    "directive": "Cross the threshold. Keep it decisive action.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "focus",
      "initiate"
    ]
  },
  {
    "idx": 29,
    "key": "Aries 30",
    "sign": "Aries",
    "degree": 30,
    "symbol": "Completion: A decisive action moment is on the table.",
    "signal": "Harvest the result. Emphasize initiate.",
    "shadow": "Skipping review repeats mistakes. Watch for impulsiveness.",
    "directive": "Complete and review. Keep it decisive action.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "focus",
      "initiate",
      "completion"
    ]
  },
  {
    "idx": 30,
    "key": "Taurus 1",
    "sign": "Taurus",
    "degree": 1,
    "symbol": "Start: A routine and craft moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize stabilize.",
    "shadow": "Rushing creates rework. Watch for stubborn comfort.",
    "directive": "Start small and make it real. Keep it routine and craft.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "focus",
      "start",
      "stabilize"
    ]
  },
  {
    "idx": 31,
    "key": "Taurus 2",
    "sign": "Taurus",
    "degree": 2,
    "symbol": "Choice: A routine and craft moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize stabilize.",
    "shadow": "Keeping both dilutes effort. Watch for stubborn comfort.",
    "directive": "Pick one lane and commit. Keep it routine and craft.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "focus",
      "stabilize"
    ]
  },
  {
    "idx": 32,
    "key": "Taurus 3",
    "sign": "Taurus",
    "degree": 3,
    "symbol": "Signal: A routine and craft moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize stabilize.",
    "shadow": "Noise hides the point. Watch for stubborn comfort.",
    "directive": "Name the signal and ignore the rest. Keep it routine and craft.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "focus",
      "stabilize",
      "signal"
    ]
  },
  {
    "idx": 33,
    "key": "Taurus 4",
    "sign": "Taurus",
    "degree": 4,
    "symbol": "Structure: A routine and craft moment is on the table.",
    "signal": "A stable frame is needed. Emphasize stabilize.",
    "shadow": "Improvisation without a base collapses. Watch for stubborn comfort.",
    "directive": "Build the container first. Keep it routine and craft.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "focus",
      "structure",
      "stabilize"
    ]
  },
  {
    "idx": 34,
    "key": "Taurus 5",
    "sign": "Taurus",
    "degree": 5,
    "symbol": "Craft: A routine and craft moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize stabilize.",
    "shadow": "Overthinking delays practice. Watch for stubborn comfort.",
    "directive": "Practice the fundamentals. Keep it routine and craft.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "focus",
      "stabilize"
    ]
  },
  {
    "idx": 35,
    "key": "Taurus 6",
    "sign": "Taurus",
    "degree": 6,
    "symbol": "Order: A routine and craft moment is on the table.",
    "signal": "Details want sorting. Emphasize stabilize.",
    "shadow": "Perfectionism blocks delivery. Watch for stubborn comfort.",
    "directive": "Organize, then ship. Keep it routine and craft.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "focus",
      "order",
      "stabilize"
    ]
  },
  {
    "idx": 36,
    "key": "Taurus 7",
    "sign": "Taurus",
    "degree": 7,
    "symbol": "Terms: A routine and craft moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize stabilize.",
    "shadow": "Avoiding terms breeds friction. Watch for stubborn comfort.",
    "directive": "State expectations plainly. Keep it routine and craft.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "focus",
      "terms",
      "stabilize"
=======
    "key": "Taurus_6",
    "sign": "Taurus",
    "degree": 6,
    "symbol": "A marketplace bustling with activity.",
    "signal": "Commerce and the exchange of ideas and goods.",
    "shadow": "Materialism overshadowing deeper values.",
    "directive": "Engage in exchanges that enrich your life and contribute to your community.",
    "practice": "Participate in local markets or community events to foster connections and share resources.",
    "journal": "How can I contribute to my community through the exchange of ideas or resources?",
    "tags": [
      "community",
      "exchange",
      "commerce"
    ]
  },
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  {
    "idx": 36,
    "key": "Taurus_7",
    "sign": "Taurus",
    "degree": 7,
    "symbol": "A peaceful garden filled with blooming flowers.",
    "signal": "Cultivating inner peace and beauty.",
    "shadow": "Neglecting self-care and personal growth.",
    "directive": "Focus on nurturing your environment and relationships.",
    "practice": "Spend time in nature or create a small garden space.",
    "journal": "What aspects of my life need more nurturing and attention?",
    "tags": [
      "nurturing",
      "environment",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 37,
<<<<<<< Updated upstream
    "key": "Taurus 8",
    "sign": "Taurus",
    "degree": 8,
    "symbol": "Depth: A routine and craft moment is on the table.",
    "signal": "A hidden factor matters. Emphasize stabilize.",
    "shadow": "Control replaces honesty. Watch for stubborn comfort.",
    "directive": "Confront the real issue. Keep it routine and craft.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "focus",
      "depth",
      "stabilize"
=======
    "key": "Taurus_8",
    "sign": "Taurus",
    "degree": 8,
    "symbol": "A potter shaping clay on a wheel.",
    "signal": "The importance of craftsmanship and creation.",
    "shadow": "Feeling unproductive or lacking direction.",
    "directive": "Engage in a creative project that requires skill and patience.",
    "practice": "Try your hand at a craft or artistic endeavor.",
    "journal": "What creative skills do I want to develop further?",
    "tags": [
      "creativity",
      "craftsmanship",
      "skill"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 38,
<<<<<<< Updated upstream
    "key": "Taurus 9",
    "sign": "Taurus",
    "degree": 9,
    "symbol": "Aim: A routine and craft moment is on the table.",
    "signal": "A goal needs meaning. Emphasize stabilize.",
    "shadow": "Drift wastes time. Watch for stubborn comfort.",
    "directive": "Choose direction. Keep it routine and craft.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "focus",
      "stabilize"
=======
    "key": "Taurus_9",
    "sign": "Taurus",
    "degree": 9,
    "symbol": "A farmer tending to crops in the field.",
    "signal": "Harvesting the fruits of your labor.",
    "shadow": "Overlooking the rewards of hard work.",
    "directive": "Reflect on your achievements and how far you've come.",
    "practice": "Create a list of your recent accomplishments.",
    "journal": "What have I achieved that I am proud of?",
    "tags": [
      "achievement",
      "reflection",
      "harvest"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 39,
<<<<<<< Updated upstream
    "key": "Taurus 10",
    "sign": "Taurus",
    "degree": 10,
    "symbol": "Ledger: A routine and craft moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize stabilize.",
    "shadow": "Self-worth ties to output. Watch for stubborn comfort.",
    "directive": "Measure and adjust. Keep it routine and craft.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "ledger",
      "stewardship",
      "stabilize"
=======
    "key": "Taurus_10",
    "sign": "Taurus",
    "degree": 10,
    "symbol": "A mountain climber reaching the summit.",
    "signal": "Overcoming obstacles to achieve goals.",
    "shadow": "Fear of failure or giving up too soon.",
    "directive": "Set a challenging goal and outline steps to achieve it.",
    "practice": "Take a small step toward a long-term goal today.",
    "journal": "What fears are holding me back from reaching my goals?",
    "tags": [
      "goals",
      "overcoming",
      "challenge"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 40,
<<<<<<< Updated upstream
    "key": "Taurus 11",
    "sign": "Taurus",
    "degree": 11,
    "symbol": "Network: A routine and craft moment is on the table.",
    "signal": "Support systems matter. Emphasize stabilize.",
    "shadow": "Isolation becomes a habit. Watch for stubborn comfort.",
    "directive": "Share the plan. Keep it routine and craft.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "focus",
      "stabilize",
      "network"
=======
    "key": "Taurus_11",
    "sign": "Taurus",
    "degree": 11,
    "symbol": "A wise elder sharing knowledge with youth.",
    "signal": "The value of mentorship and wisdom sharing.",
    "shadow": "Ignoring the lessons of experience.",
    "directive": "Seek opportunities to learn from others or teach what you know.",
    "practice": "Connect with a mentor or mentee this week.",
    "journal": "What lessons have I learned that I can share with others?",
    "tags": [
      "mentorship",
      "wisdom",
      "learning"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 41,
<<<<<<< Updated upstream
    "key": "Taurus 12",
    "sign": "Taurus",
    "degree": 12,
    "symbol": "Reset: A routine and craft moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize stabilize.",
    "shadow": "Escaping replaces rest. Watch for stubborn comfort.",
    "directive": "Pause and return with intent. Keep it routine and craft.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "focus",
      "reset",
      "stabilize"
=======
    "key": "Taurus_12",
    "sign": "Taurus",
    "degree": 12,
    "symbol": "A family gathered around a dinner table.",
    "signal": "The importance of community and connection.",
    "shadow": "Feeling isolated or disconnected from loved ones.",
    "directive": "Strengthen your bonds with family and friends.",
    "practice": "Host a gathering or reach out to someone you care about.",
    "journal": "How can I foster deeper connections with my loved ones?",
    "tags": [
      "community",
      "connection",
      "family"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 42,
<<<<<<< Updated upstream
    "key": "Taurus 13",
    "sign": "Taurus",
    "degree": 13,
    "symbol": "Commit: A routine and craft moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize stabilize.",
    "shadow": "Half-commitment drains energy. Watch for stubborn comfort.",
    "directive": "Commit fully. Keep it routine and craft.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "focus",
      "commit",
      "stabilize"
=======
    "key": "Taurus_13",
    "sign": "Taurus",
    "degree": 13,
    "symbol": "A musician performing in a lively concert.",
    "signal": "Expressing joy and creativity through art.",
    "shadow": "Suppressing your creative expression.",
    "directive": "Find ways to express yourself creatively and joyfully.",
    "practice": "Attend a concert or create music/art yourself.",
    "journal": "What brings me joy and how can I express it more?",
    "tags": [
      "creativity",
      "expression",
      "joy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 43,
<<<<<<< Updated upstream
    "key": "Taurus 14",
    "sign": "Taurus",
    "degree": 14,
    "symbol": "Boundaries: A routine and craft moment is on the table.",
    "signal": "Limits protect value. Emphasize stabilize.",
    "shadow": "Saying yes too fast costs you. Watch for stubborn comfort.",
    "directive": "Set a boundary. Keep it routine and craft.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "focus",
      "stabilize"
=======
    "key": "Taurus_14",
    "sign": "Taurus",
    "degree": 14,
    "symbol": "A treasure chest overflowing with riches.",
    "signal": "Recognizing and appreciating abundance in your life.",
    "shadow": "Taking abundance for granted or feeling lack.",
    "directive": "Practice gratitude for what you have.",
    "practice": "Keep a gratitude journal and write daily entries.",
    "journal": "What abundance do I often overlook in my life?",
    "tags": [
      "abundance",
      "gratitude",
      "appreciation"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 44,
<<<<<<< Updated upstream
    "key": "Taurus 15",
    "sign": "Taurus",
    "degree": 15,
    "symbol": "Mirror: A routine and craft moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize stabilize.",
    "shadow": "Defensiveness blocks learning. Watch for stubborn comfort.",
    "directive": "Take the note. Keep it routine and craft.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "focus",
      "stabilize"
=======
    "key": "Taurus_15",
    "sign": "Taurus",
    "degree": 15,
    "symbol": "A sculptor chiseling a statue from marble.",
    "signal": "The process of refinement and transformation.",
    "shadow": "Resisting change or clinging to the past.",
    "directive": "Embrace the changes that lead to personal growth.",
    "practice": "Identify an area of your life that needs refinement.",
    "journal": "What changes am I resisting that could lead to growth?",
    "tags": [
      "transformation",
      "refinement",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 45,
<<<<<<< Updated upstream
    "key": "Taurus 16",
    "sign": "Taurus",
    "degree": 16,
    "symbol": "Repair: A routine and craft moment is on the table.",
    "signal": "Something wants fixing. Emphasize stabilize.",
    "shadow": "Avoidance compounds cost. Watch for stubborn comfort.",
    "directive": "Repair it. Keep it routine and craft.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "focus",
      "stabilize",
      "repair"
=======
    "key": "Taurus_16",
    "sign": "Taurus",
    "degree": 16,
    "symbol": "A market bustling with vendors and customers.",
    "signal": "Engaging in commerce and community exchange.",
    "shadow": "Feeling disconnected from your community or resources.",
    "directive": "Participate in local markets or community events.",
    "practice": "Support local businesses or artisans.",
    "journal": "How can I contribute to my community's economy?",
    "tags": [
      "community",
      "commerce",
      "exchange"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 46,
<<<<<<< Updated upstream
    "key": "Taurus 17",
    "sign": "Taurus",
    "degree": 17,
    "symbol": "Focus: A routine and craft moment is on the table.",
    "signal": "Attention is currency. Emphasize stabilize.",
    "shadow": "Multitasking reduces quality. Watch for stubborn comfort.",
    "directive": "Single-task. Keep it routine and craft.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "stabilize"
=======
    "key": "Taurus_17",
    "sign": "Taurus",
    "degree": 17,
    "symbol": "A gardener planting seeds in rich soil.",
    "signal": "The potential for new beginnings and growth.",
    "shadow": "Fear of starting something new or taking risks.",
    "directive": "Take the first step toward a new project or goal.",
    "practice": "Plant seeds—literally or metaphorically—in your life.",
    "journal": "What new beginnings am I ready to embrace?",
    "tags": [
      "new beginnings",
      "growth",
      "risk"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 47,
<<<<<<< Updated upstream
    "key": "Taurus 18",
    "sign": "Taurus",
    "degree": 18,
    "symbol": "Standard: A routine and craft moment is on the table.",
    "signal": "Quality needs definition. Emphasize stabilize.",
    "shadow": "Vague standards create stress. Watch for stubborn comfort.",
    "directive": "Define the standard. Keep it routine and craft.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "focus",
      "stabilize",
      "standard"
=======
    "key": "Taurus_18",
    "sign": "Taurus",
    "degree": 18,
    "symbol": "A serene lake reflecting the sky.",
    "signal": "Finding tranquility and balance within.",
    "shadow": "Being overwhelmed by chaos or stress.",
    "directive": "Cultivate inner peace through mindfulness practices.",
    "practice": "Spend time in meditation or quiet reflection.",
    "journal": "What practices help me find balance in my life?",
    "tags": [
      "tranquility",
      "balance",
      "mindfulness"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 48,
<<<<<<< Updated upstream
    "key": "Taurus 19",
    "sign": "Taurus",
    "degree": 19,
    "symbol": "Tempo: A routine and craft moment is on the table.",
    "signal": "Timing matters. Emphasize stabilize.",
    "shadow": "Forcing pace breaks form. Watch for stubborn comfort.",
    "directive": "Set the pace. Keep it routine and craft.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "focus",
      "tempo",
      "stabilize"
=======
    "key": "Taurus_19",
    "sign": "Taurus",
    "degree": 19,
    "symbol": "A large, well-kept garden.",
    "signal": "Nurturing growth and beauty in your surroundings.",
    "shadow": "Neglecting the details that sustain your environment.",
    "directive": "Cultivate your space with intention and care.",
    "practice": "Spend time tending to a garden or creating a nurturing environment at home.",
    "journal": "What aspects of my environment need more attention and care?",
    "tags": [
      "growth",
      "nurturing",
      "environment",
      "attention"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 49,
<<<<<<< Updated upstream
    "key": "Taurus 20",
    "sign": "Taurus",
    "degree": 20,
    "symbol": "Risk: A routine and craft moment is on the table.",
    "signal": "A calculated step is required. Emphasize stabilize.",
    "shadow": "Impulse risk is not courage. Watch for stubborn comfort.",
    "directive": "Take a measured risk. Keep it routine and craft.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "focus",
      "stabilize",
      "risk"
=======
    "key": "Taurus_20",
    "sign": "Taurus",
    "degree": 20,
    "symbol": "A sculptor chiseling a statue.",
    "signal": "The process of shaping your reality through effort.",
    "shadow": "Feeling stuck or unable to express your creativity.",
    "directive": "Engage in a creative project that allows for self-expression.",
    "practice": "Try your hand at a craft or art form that excites you.",
    "journal": "What creative expression have I been avoiding, and why?",
    "tags": [
      "creativity",
      "expression",
      "craft",
      "effort"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 50,
<<<<<<< Updated upstream
    "key": "Taurus 21",
    "sign": "Taurus",
    "degree": 21,
    "symbol": "Integration: A routine and craft moment is on the table.",
    "signal": "Pieces want alignment. Emphasize stabilize.",
    "shadow": "Fragmentation creates fatigue. Watch for stubborn comfort.",
    "directive": "Integrate. Keep it routine and craft.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "focus",
      "stabilize"
=======
    "key": "Taurus_21",
    "sign": "Taurus",
    "degree": 21,
    "symbol": "A person planting seeds.",
    "signal": "Initiating new beginnings and ventures.",
    "shadow": "Fear of failure holding you back from starting.",
    "directive": "Take the first step towards a new goal or project.",
    "practice": "Make a list of intentions and take action on one today.",
    "journal": "What new beginnings am I ready to embrace?",
    "tags": [
      "new beginnings",
      "intentions",
      "action",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 51,
<<<<<<< Updated upstream
    "key": "Taurus 22",
    "sign": "Taurus",
    "degree": 22,
    "symbol": "Authority: A routine and craft moment is on the table.",
    "signal": "Own responsibility. Emphasize stabilize.",
    "shadow": "Blame delays progress. Watch for stubborn comfort.",
    "directive": "Take ownership. Keep it routine and craft.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "focus",
      "authority",
      "stabilize"
=======
    "key": "Taurus_22",
    "sign": "Taurus",
    "degree": 22,
    "symbol": "A serene lake reflecting the sky.",
    "signal": "Finding peace and clarity within yourself.",
    "shadow": "Being overwhelmed by external chaos.",
    "directive": "Seek moments of stillness to reconnect with your inner self.",
    "practice": "Spend time in nature or meditate by a body of water.",
    "journal": "How can I create more stillness in my life?",
    "tags": [
      "peace",
      "clarity",
      "stillness",
      "nature"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 52,
<<<<<<< Updated upstream
    "key": "Taurus 23",
    "sign": "Taurus",
    "degree": 23,
    "symbol": "Refine: A routine and craft moment is on the table.",
    "signal": "Polish after completion. Emphasize stabilize.",
    "shadow": "Editing before finishing stalls. Watch for stubborn comfort.",
    "directive": "Refine the finished draft. Keep it routine and craft.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "focus",
      "stabilize"
=======
    "key": "Taurus_23",
    "sign": "Taurus",
    "degree": 23,
    "symbol": "A farmer harvesting crops.",
    "signal": "Reaping the rewards of hard work and dedication.",
    "shadow": "Taking success for granted or not acknowledging efforts.",
    "directive": "Celebrate your achievements, no matter how small.",
    "practice": "Reflect on your recent accomplishments and share them with someone.",
    "journal": "What have I harvested in my life recently that deserves recognition?",
    "tags": [
      "success",
      "achievement",
      "celebration",
      "gratitude"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 53,
<<<<<<< Updated upstream
    "key": "Taurus 24",
    "sign": "Taurus",
    "degree": 24,
    "symbol": "Stewardship: A routine and craft moment is on the table.",
    "signal": "Resources need care. Emphasize stabilize.",
    "shadow": "Waste hides in habits. Watch for stubborn comfort.",
    "directive": "Protect resources. Keep it routine and craft.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "stewardship",
      "stabilize"
=======
    "key": "Taurus_24",
    "sign": "Taurus",
    "degree": 24,
    "symbol": "A family gathered around a table.",
    "signal": "The importance of connection and shared experiences.",
    "shadow": "Feeling isolated or disconnected from loved ones.",
    "directive": "Prioritize quality time with family or friends.",
    "practice": "Plan a gathering or a simple meal with loved ones.",
    "journal": "How can I strengthen my connections with those I care about?",
    "tags": [
      "connection",
      "family",
      "community",
      "relationships"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 54,
<<<<<<< Updated upstream
    "key": "Taurus 25",
    "sign": "Taurus",
    "degree": 25,
    "symbol": "Signal-to-noise: A routine and craft moment is on the table.",
    "signal": "Simplify inputs. Emphasize stabilize.",
    "shadow": "Overconsumption clouds judgment. Watch for stubborn comfort.",
    "directive": "Reduce intake. Keep it routine and craft.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "focus",
      "stabilize"
=======
    "key": "Taurus_25",
    "sign": "Taurus",
    "degree": 25,
    "symbol": "A mountain climber reaching a summit.",
    "signal": "Achieving personal goals through perseverance.",
    "shadow": "Doubting your ability to reach your aspirations.",
    "directive": "Set a clear goal and outline the steps needed to achieve it.",
    "practice": "Create a vision board or action plan for your aspirations.",
    "journal": "What summit am I striving to reach, and what steps will I take?",
    "tags": [
      "goals",
      "perseverance",
      "achievement",
      "aspiration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 55,
<<<<<<< Updated upstream
    "key": "Taurus 26",
    "sign": "Taurus",
    "degree": 26,
    "symbol": "Sustain: A routine and craft moment is on the table.",
    "signal": "Make it last. Emphasize stabilize.",
    "shadow": "Burnout follows spikes. Watch for stubborn comfort.",
    "directive": "Sustain. Keep it routine and craft.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "focus",
      "sustain",
      "stabilize"
=======
    "key": "Taurus_26",
    "sign": "Taurus",
    "degree": 26,
    "symbol": "A musician playing a soulful melody.",
    "signal": "Expressing emotions through art and creativity.",
    "shadow": "Suppressing feelings or avoiding creative outlets.",
    "directive": "Allow yourself to express emotions through a creative medium.",
    "practice": "Listen to music that resonates with you or create your own.",
    "journal": "What emotions am I currently holding back, and how can I express them?",
    "tags": [
      "expression",
      "emotion",
      "creativity",
      "art"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 56,
<<<<<<< Updated upstream
    "key": "Taurus 27",
    "sign": "Taurus",
    "degree": 27,
    "symbol": "Legacy: A routine and craft moment is on the table.",
    "signal": "Long-term view matters. Emphasize stabilize.",
    "shadow": "Short-term ego derails. Watch for stubborn comfort.",
    "directive": "Think long. Keep it routine and craft.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "legacy",
      "stewardship",
      "stabilize"
=======
    "key": "Taurus_27",
    "sign": "Taurus",
    "degree": 27,
    "symbol": "A wise elder sharing stories.",
    "signal": "The value of wisdom and shared experiences.",
    "shadow": "Ignoring the lessons of the past.",
    "directive": "Seek knowledge from those with more experience.",
    "practice": "Engage in conversations with mentors or elders.",
    "journal": "What lessons from my past can I apply to my present?",
    "tags": [
      "wisdom",
      "experience",
      "learning",
      "mentorship"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 57,
<<<<<<< Updated upstream
    "key": "Taurus 28",
    "sign": "Taurus",
    "degree": 28,
    "symbol": "Closure: A routine and craft moment is on the table.",
    "signal": "Finish cycles. Emphasize stabilize.",
    "shadow": "Open loops drain attention. Watch for stubborn comfort.",
    "directive": "Close the loop. Keep it routine and craft.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "focus",
      "stabilize"
=======
    "key": "Taurus_28",
    "sign": "Taurus",
    "degree": 28,
    "symbol": "A vibrant marketplace bustling with activity.",
    "signal": "Engaging with community and commerce.",
    "shadow": "Feeling disconnected from your local community.",
    "directive": "Participate in local events or support local businesses.",
    "practice": "Visit a farmer's market or community event this week.",
    "journal": "How can I better connect with my community?",
    "tags": [
      "community",
      "commerce",
      "engagement",
      "local"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 58,
<<<<<<< Updated upstream
    "key": "Taurus 29",
    "sign": "Taurus",
    "degree": 29,
    "symbol": "Threshold: A routine and craft moment is on the table.",
    "signal": "A transition is near. Emphasize stabilize.",
    "shadow": "Hesitation creates drift. Watch for stubborn comfort.",
    "directive": "Cross the threshold. Keep it routine and craft.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "focus",
      "stabilize"
=======
    "key": "Taurus_29",
    "sign": "Taurus",
    "degree": 29,
    "symbol": "A person meditating in a tranquil setting.",
    "signal": "Finding inner peace and balance.",
    "shadow": "Struggling with inner turmoil or distractions.",
    "directive": "Prioritize self-care and mindfulness practices.",
    "practice": "Dedicate time each day for meditation or quiet reflection.",
    "journal": "What practices help me find my center amidst chaos?",
    "tags": [
      "mindfulness",
      "self-care",
      "balance",
      "peace"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 59,
<<<<<<< Updated upstream
    "key": "Taurus 30",
    "sign": "Taurus",
    "degree": 30,
    "symbol": "Completion: A routine and craft moment is on the table.",
    "signal": "Harvest the result. Emphasize stabilize.",
    "shadow": "Skipping review repeats mistakes. Watch for stubborn comfort.",
    "directive": "Complete and review. Keep it routine and craft.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "focus",
      "stabilize",
      "completion"
=======
    "key": "Taurus_30",
    "sign": "Taurus",
    "degree": 30,
    "symbol": "A beautiful tapestry being woven.",
    "signal": "Creating a rich, interconnected life.",
    "shadow": "Feeling fragmented or disconnected from your path.",
    "directive": "Weave together different aspects of your life into a cohesive whole.",
    "practice": "Reflect on how your experiences connect and contribute to your journey.",
    "journal": "What threads of my life need to be woven together for greater harmony?",
    "tags": [
      "interconnection",
      "life path",
      "harmony",
      "integration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 60,
<<<<<<< Updated upstream
    "key": "Gemini 1",
    "sign": "Gemini",
    "degree": 1,
    "symbol": "Start: A information and framing moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize clarify.",
    "shadow": "Rushing creates rework. Watch for scatter.",
    "directive": "Start small and make it real. Keep it information and framing.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "clarify",
      "start",
      "focus"
=======
    "key": "Gemini1",
    "sign": "Gemini",
    "degree": 1,
    "symbol": "A new beginning in communication.",
    "signal": "Embrace fresh ideas and perspectives.",
    "shadow": "Avoid superficiality in conversations.",
    "directive": "Engage in meaningful dialogues to foster understanding.",
    "practice": "Start a journal to document your thoughts and insights daily.",
    "journal": "What new ideas have emerged in your conversations recently?",
    "tags": [
      "communication",
      "new beginnings",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 61,
<<<<<<< Updated upstream
    "key": "Gemini 2",
    "sign": "Gemini",
    "degree": 2,
    "symbol": "Choice: A information and framing moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize clarify.",
    "shadow": "Keeping both dilutes effort. Watch for scatter.",
    "directive": "Pick one lane and commit. Keep it information and framing.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "clarify",
      "focus"
=======
    "key": "Gemini2",
    "sign": "Gemini",
    "degree": 2,
    "symbol": "A pair of lovers communicating openly.",
    "signal": "Value honesty in relationships.",
    "shadow": "Beware of misunderstandings that can arise from assumptions.",
    "directive": "Practice active listening to deepen connections.",
    "practice": "Have a heart-to-heart conversation with someone close.",
    "journal": "How can you improve communication in your relationships?",
    "tags": [
      "relationships",
      "honesty",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 62,
<<<<<<< Updated upstream
    "key": "Gemini 3",
    "sign": "Gemini",
    "degree": 3,
    "symbol": "Signal: A information and framing moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize clarify.",
    "shadow": "Noise hides the point. Watch for scatter.",
    "directive": "Name the signal and ignore the rest. Keep it information and framing.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "clarify",
      "focus",
      "signal"
=======
    "key": "Gemini3",
    "sign": "Gemini",
    "degree": 3,
    "symbol": "A lively debate among friends.",
    "signal": "Encourage diverse opinions and healthy discussions.",
    "shadow": "Avoid arguments that lead to division.",
    "directive": "Create a space for open dialogue and exchange of ideas.",
    "practice": "Host a discussion group on a topic of interest.",
    "journal": "What differing viewpoints have challenged your own recently?",
    "tags": [
      "debate",
      "discussion",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 63,
<<<<<<< Updated upstream
    "key": "Gemini 4",
    "sign": "Gemini",
    "degree": 4,
    "symbol": "Structure: A information and framing moment is on the table.",
    "signal": "A stable frame is needed. Emphasize clarify.",
    "shadow": "Improvisation without a base collapses. Watch for scatter.",
    "directive": "Build the container first. Keep it information and framing.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "clarify",
      "focus",
      "structure"
=======
    "key": "Gemini4",
    "sign": "Gemini",
    "degree": 4,
    "symbol": "A messenger delivering important news.",
    "signal": "Stay informed and share valuable information.",
    "shadow": "Avoid spreading rumors or unverified claims.",
    "directive": "Be a reliable source of information for others.",
    "practice": "Research a topic and share your findings with someone.",
    "journal": "What important news have you recently encountered?",
    "tags": [
      "information",
      "messenger",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 64,
<<<<<<< Updated upstream
    "key": "Gemini 5",
    "sign": "Gemini",
    "degree": 5,
    "symbol": "Craft: A information and framing moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize clarify.",
    "shadow": "Overthinking delays practice. Watch for scatter.",
    "directive": "Practice the fundamentals. Keep it information and framing.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "clarify",
      "focus"
=======
    "key": "Gemini5",
    "sign": "Gemini",
    "degree": 5,
    "symbol": "A group brainstorming session.",
    "signal": "Collaborate to generate innovative ideas.",
    "shadow": "Watch for dominance of a single voice in group settings.",
    "directive": "Encourage contributions from all participants.",
    "practice": "Organize a creative brainstorming session with peers.",
    "journal": "What innovative ideas emerged from your last collaboration?",
    "tags": [
      "creativity",
      "collaboration",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 65,
<<<<<<< Updated upstream
    "key": "Gemini 6",
    "sign": "Gemini",
    "degree": 6,
    "symbol": "Order: A information and framing moment is on the table.",
    "signal": "Details want sorting. Emphasize clarify.",
    "shadow": "Perfectionism blocks delivery. Watch for scatter.",
    "directive": "Organize, then ship. Keep it information and framing.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "clarify",
      "order",
      "focus"
=======
    "key": "Gemini6",
    "sign": "Gemini",
    "degree": 6,
    "symbol": "A child learning to speak.",
    "signal": "Embrace the learning process and express yourself.",
    "shadow": "Avoid fear of judgment that stifles your voice.",
    "directive": "Practice articulating your thoughts clearly.",
    "practice": "Join a public speaking group to build confidence.",
    "journal": "What fears hold you back from expressing yourself fully?",
    "tags": [
      "learning",
      "expression",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 66,
<<<<<<< Updated upstream
    "key": "Gemini 7",
    "sign": "Gemini",
    "degree": 7,
    "symbol": "Terms: A information and framing moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize clarify.",
    "shadow": "Avoiding terms breeds friction. Watch for scatter.",
    "directive": "State expectations plainly. Keep it information and framing.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "clarify",
      "terms",
      "focus"
=======
    "key": "Gemini7",
    "sign": "Gemini",
    "degree": 7,
    "symbol": "A teacher sharing knowledge.",
    "signal": "Share your expertise to empower others.",
    "shadow": "Avoid arrogance in your teaching approach.",
    "directive": "Mentor someone who seeks guidance in your area of expertise.",
    "practice": "Create a workshop or tutorial on a skill you possess.",
    "journal": "Who could benefit from your knowledge and experience?",
    "tags": [
      "teaching",
      "mentorship",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 67,
<<<<<<< Updated upstream
    "key": "Gemini 8",
    "sign": "Gemini",
    "degree": 8,
    "symbol": "Depth: A information and framing moment is on the table.",
    "signal": "A hidden factor matters. Emphasize clarify.",
    "shadow": "Control replaces honesty. Watch for scatter.",
    "directive": "Confront the real issue. Keep it information and framing.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "clarify",
      "depth",
      "focus"
=======
    "key": "Gemini8",
    "sign": "Gemini",
    "degree": 8,
    "symbol": "A journalist uncovering the truth.",
    "signal": "Seek clarity and truth in your communications.",
    "shadow": "Beware of biases that cloud your judgment.",
    "directive": "Investigate a topic thoroughly before forming opinions.",
    "practice": "Write an article or blog post based on your research.",
    "journal": "What truths have you uncovered in your recent inquiries?",
    "tags": [
      "truth",
      "investigation",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 68,
<<<<<<< Updated upstream
    "key": "Gemini 9",
    "sign": "Gemini",
    "degree": 9,
    "symbol": "Aim: A information and framing moment is on the table.",
    "signal": "A goal needs meaning. Emphasize clarify.",
    "shadow": "Drift wastes time. Watch for scatter.",
    "directive": "Choose direction. Keep it information and framing.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "focus",
      "clarify"
=======
    "key": "Gemini9",
    "sign": "Gemini",
    "degree": 9,
    "symbol": "A network of interconnected ideas.",
    "signal": "Recognize the value of interconnectedness in knowledge.",
    "shadow": "Avoid isolation in your thinking process.",
    "directive": "Connect different ideas to form a cohesive understanding.",
    "practice": "Create a mind map of a complex topic to visualize connections.",
    "journal": "What connections between ideas have you recently discovered?",
    "tags": [
      "interconnectedness",
      "knowledge",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 69,
<<<<<<< Updated upstream
    "key": "Gemini 10",
    "sign": "Gemini",
    "degree": 10,
    "symbol": "Ledger: A information and framing moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize clarify.",
    "shadow": "Self-worth ties to output. Watch for scatter.",
    "directive": "Measure and adjust. Keep it information and framing.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "clarify",
      "ledger",
      "stewardship"
=======
    "key": "Gemini10",
    "sign": "Gemini",
    "degree": 10,
    "symbol": "A performer captivating an audience.",
    "signal": "Engage and inspire others through your expression.",
    "shadow": "Beware of seeking validation over authenticity.",
    "directive": "Share your talents in a way that resonates with others.",
    "practice": "Perform or present something you are passionate about.",
    "journal": "How do you feel when you share your talents with others?",
    "tags": [
      "performance",
      "expression",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 70,
<<<<<<< Updated upstream
    "key": "Gemini 11",
    "sign": "Gemini",
    "degree": 11,
    "symbol": "Network: A information and framing moment is on the table.",
    "signal": "Support systems matter. Emphasize clarify.",
    "shadow": "Isolation becomes a habit. Watch for scatter.",
    "directive": "Share the plan. Keep it information and framing.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "clarify",
      "focus",
      "network"
=======
    "key": "Gemini11",
    "sign": "Gemini",
    "degree": 11,
    "symbol": "A community gathering to celebrate.",
    "signal": "Foster a sense of belonging and connection.",
    "shadow": "Avoid exclusion of those who may feel left out.",
    "directive": "Organize an event that brings people together.",
    "practice": "Plan a gathering to celebrate a shared interest or achievement.",
    "journal": "How can you create a more inclusive environment in your community?",
    "tags": [
      "community",
      "celebration",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 71,
<<<<<<< Updated upstream
    "key": "Gemini 12",
    "sign": "Gemini",
    "degree": 12,
    "symbol": "Reset: A information and framing moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize clarify.",
    "shadow": "Escaping replaces rest. Watch for scatter.",
    "directive": "Pause and return with intent. Keep it information and framing.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "clarify",
      "focus",
      "reset"
=======
    "key": "Gemini12",
    "sign": "Gemini",
    "degree": 12,
    "symbol": "A thinker contemplating profound ideas.",
    "signal": "Engage in deep reflection to enhance understanding.",
    "shadow": "Avoid getting lost in overthinking without action.",
    "directive": "Set aside time for introspection and contemplation.",
    "practice": "Meditate or journal on a topic that intrigues you.",
    "journal": "What profound insights have emerged from your reflections?",
    "tags": [
      "introspection",
      "reflection",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 72,
<<<<<<< Updated upstream
    "key": "Gemini 13",
    "sign": "Gemini",
    "degree": 13,
    "symbol": "Commit: A information and framing moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize clarify.",
    "shadow": "Half-commitment drains energy. Watch for scatter.",
    "directive": "Commit fully. Keep it information and framing.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "clarify",
      "commit",
      "focus"
=======
    "key": "Gemini_13",
    "sign": "Gemini",
    "degree": 13,
    "symbol": "A group of people gathered around a campfire.",
    "signal": "Community and shared experiences.",
    "shadow": "Isolation and disconnection from others.",
    "directive": "Engage with your community to foster connections.",
    "practice": "Host a gathering or participate in a local event.",
    "journal": "What steps can I take to strengthen my connections with others?",
    "tags": [
      "community",
      "connection",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 73,
<<<<<<< Updated upstream
    "key": "Gemini 14",
    "sign": "Gemini",
    "degree": 14,
    "symbol": "Boundaries: A information and framing moment is on the table.",
    "signal": "Limits protect value. Emphasize clarify.",
    "shadow": "Saying yes too fast costs you. Watch for scatter.",
    "directive": "Set a boundary. Keep it information and framing.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "clarify",
      "focus"
=======
    "key": "Gemini_14",
    "sign": "Gemini",
    "degree": 14,
    "symbol": "A bridge spanning a river.",
    "signal": "Transition and overcoming obstacles.",
    "shadow": "Fear of change and stagnation.",
    "directive": "Embrace transitions as opportunities for growth.",
    "practice": "Identify a change you’ve been avoiding and take a small step towards it.",
    "journal": "What bridges do I need to build in my life to move forward?",
    "tags": [
      "transition",
      "growth",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 74,
<<<<<<< Updated upstream
    "key": "Gemini 15",
    "sign": "Gemini",
    "degree": 15,
    "symbol": "Mirror: A information and framing moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize clarify.",
    "shadow": "Defensiveness blocks learning. Watch for scatter.",
    "directive": "Take the note. Keep it information and framing.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "focus",
      "clarify"
=======
    "key": "Gemini_15",
    "sign": "Gemini",
    "degree": 15,
    "symbol": "A clock tower.",
    "signal": "The passage of time and the importance of timing.",
    "shadow": "Procrastination and poor time management.",
    "directive": "Be mindful of how you allocate your time.",
    "practice": "Create a schedule for your week, prioritizing key tasks.",
    "journal": "How can I better manage my time to achieve my goals?",
    "tags": [
      "time",
      "management",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 75,
<<<<<<< Updated upstream
    "key": "Gemini 16",
    "sign": "Gemini",
    "degree": 16,
    "symbol": "Repair: A information and framing moment is on the table.",
    "signal": "Something wants fixing. Emphasize clarify.",
    "shadow": "Avoidance compounds cost. Watch for scatter.",
    "directive": "Repair it. Keep it information and framing.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "clarify",
      "focus",
      "repair"
=======
    "key": "Gemini_16",
    "sign": "Gemini",
    "degree": 16,
    "symbol": "A busy marketplace.",
    "signal": "Commerce and the exchange of ideas.",
    "shadow": "Competition and conflict in communication.",
    "directive": "Engage in conversations that promote understanding.",
    "practice": "Attend a networking event or discussion group.",
    "journal": "What ideas do I want to share with others, and how can I express them clearly?",
    "tags": [
      "communication",
      "ideas",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 76,
<<<<<<< Updated upstream
    "key": "Gemini 17",
    "sign": "Gemini",
    "degree": 17,
    "symbol": "Focus: A information and framing moment is on the table.",
    "signal": "Attention is currency. Emphasize clarify.",
    "shadow": "Multitasking reduces quality. Watch for scatter.",
    "directive": "Single-task. Keep it information and framing.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "clarify"
=======
    "key": "Gemini_17",
    "sign": "Gemini",
    "degree": 17,
    "symbol": "A child playing with building blocks.",
    "signal": "Creativity and the joy of creation.",
    "shadow": "Stifled creativity and fear of failure.",
    "directive": "Allow yourself to play and explore your creative side.",
    "practice": "Engage in a creative activity without judgment.",
    "journal": "What creative pursuits have I neglected, and how can I reintroduce them into my life?",
    "tags": [
      "creativity",
      "play",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 77,
<<<<<<< Updated upstream
    "key": "Gemini 18",
    "sign": "Gemini",
    "degree": 18,
    "symbol": "Standard: A information and framing moment is on the table.",
    "signal": "Quality needs definition. Emphasize clarify.",
    "shadow": "Vague standards create stress. Watch for scatter.",
    "directive": "Define the standard. Keep it information and framing.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "clarify",
      "focus",
      "standard"
=======
    "key": "Gemini_18",
    "sign": "Gemini",
    "degree": 18,
    "symbol": "An open book.",
    "signal": "Knowledge and the pursuit of learning.",
    "shadow": "Ignorance and resistance to new information.",
    "directive": "Seek out new knowledge and perspectives.",
    "practice": "Read a book or take a course on a topic of interest.",
    "journal": "What knowledge do I wish to acquire, and how will it benefit me?",
    "tags": [
      "knowledge",
      "learning",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 78,
<<<<<<< Updated upstream
    "key": "Gemini 19",
    "sign": "Gemini",
    "degree": 19,
    "symbol": "Tempo: A information and framing moment is on the table.",
    "signal": "Timing matters. Emphasize clarify.",
    "shadow": "Forcing pace breaks form. Watch for scatter.",
    "directive": "Set the pace. Keep it information and framing.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "clarify",
      "tempo",
      "focus"
=======
    "key": "Gemini_19",
    "sign": "Gemini",
    "degree": 19,
    "symbol": "A pair of dancers.",
    "signal": "Harmony and collaboration.",
    "shadow": "Conflict and lack of cooperation.",
    "directive": "Foster collaboration in your relationships.",
    "practice": "Partner with someone on a project or activity.",
    "journal": "How can I better collaborate with others in my personal or professional life?",
    "tags": [
      "collaboration",
      "harmony",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 79,
<<<<<<< Updated upstream
    "key": "Gemini 20",
    "sign": "Gemini",
    "degree": 20,
    "symbol": "Risk: A information and framing moment is on the table.",
    "signal": "A calculated step is required. Emphasize clarify.",
    "shadow": "Impulse risk is not courage. Watch for scatter.",
    "directive": "Take a measured risk. Keep it information and framing.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "clarify",
      "focus",
      "risk"
=======
    "key": "Gemini_20",
    "sign": "Gemini",
    "degree": 20,
    "symbol": "A road leading into the distance.",
    "signal": "Journey and exploration.",
    "shadow": "Fear of the unknown and stagnation.",
    "directive": "Embrace new experiences and adventures.",
    "practice": "Plan a trip or explore a new area in your city.",
    "journal": "What new experiences am I longing for, and how can I pursue them?",
    "tags": [
      "exploration",
      "journey",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 80,
<<<<<<< Updated upstream
    "key": "Gemini 21",
    "sign": "Gemini",
    "degree": 21,
    "symbol": "Integration: A information and framing moment is on the table.",
    "signal": "Pieces want alignment. Emphasize clarify.",
    "shadow": "Fragmentation creates fatigue. Watch for scatter.",
    "directive": "Integrate. Keep it information and framing.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "clarify",
      "focus"
=======
    "key": "Gemini_21",
    "sign": "Gemini",
    "degree": 21,
    "symbol": "A wise elder sharing stories.",
    "signal": "Wisdom and the sharing of knowledge.",
    "shadow": "Dismissal of experience and wisdom.",
    "directive": "Share your experiences to help others learn.",
    "practice": "Mentor someone or write about your experiences.",
    "journal": "What lessons have I learned that could benefit others?",
    "tags": [
      "wisdom",
      "mentorship",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 81,
<<<<<<< Updated upstream
    "key": "Gemini 22",
    "sign": "Gemini",
    "degree": 22,
    "symbol": "Authority: A information and framing moment is on the table.",
    "signal": "Own responsibility. Emphasize clarify.",
    "shadow": "Blame delays progress. Watch for scatter.",
    "directive": "Take ownership. Keep it information and framing.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "clarify",
      "authority",
      "focus"
=======
    "key": "Gemini_22",
    "sign": "Gemini",
    "degree": 22,
    "symbol": "A butterfly emerging from a cocoon.",
    "signal": "Transformation and personal growth.",
    "shadow": "Resistance to change and staying in comfort zones.",
    "directive": "Embrace your personal transformation journey.",
    "practice": "Identify an area of your life where you want to grow and take action.",
    "journal": "What transformations am I currently undergoing, and how can I support them?",
    "tags": [
      "transformation",
      "growth",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 82,
<<<<<<< Updated upstream
    "key": "Gemini 23",
    "sign": "Gemini",
    "degree": 23,
    "symbol": "Refine: A information and framing moment is on the table.",
    "signal": "Polish after completion. Emphasize clarify.",
    "shadow": "Editing before finishing stalls. Watch for scatter.",
    "directive": "Refine the finished draft. Keep it information and framing.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "focus",
      "clarify"
=======
    "key": "Gemini_23",
    "sign": "Gemini",
    "degree": 23,
    "symbol": "A person looking through a telescope.",
    "signal": "Vision and foresight.",
    "shadow": "Narrow-mindedness and lack of perspective.",
    "directive": "Broaden your horizons and consider future possibilities.",
    "practice": "Set long-term goals and visualize your future.",
    "journal": "What future possibilities excite me, and how can I work towards them?",
    "tags": [
      "vision",
      "foresight",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 83,
<<<<<<< Updated upstream
    "key": "Gemini 24",
    "sign": "Gemini",
    "degree": 24,
    "symbol": "Stewardship: A information and framing moment is on the table.",
    "signal": "Resources need care. Emphasize clarify.",
    "shadow": "Waste hides in habits. Watch for scatter.",
    "directive": "Protect resources. Keep it information and framing.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "clarify",
      "stewardship"
=======
    "key": "Gemini_24",
    "sign": "Gemini",
    "degree": 24,
    "symbol": "A musician playing a melody.",
    "signal": "Expression and creativity through art.",
    "shadow": "Suppression of creative expression.",
    "directive": "Express yourself through your preferred art form.",
    "practice": "Create or perform something artistic that resonates with you.",
    "journal": "What artistic expressions have I been holding back, and how can I share them?",
    "tags": [
      "art",
      "expression",
      "Gemini"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 84,
<<<<<<< Updated upstream
    "key": "Gemini 25",
    "sign": "Gemini",
    "degree": 25,
    "symbol": "Signal-to-noise: A information and framing moment is on the table.",
    "signal": "Simplify inputs. Emphasize clarify.",
    "shadow": "Overconsumption clouds judgment. Watch for scatter.",
    "directive": "Reduce intake. Keep it information and framing.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "clarify",
      "focus"
=======
    "key": "Gemini_25",
    "sign": "Gemini",
    "degree": 25,
    "symbol": "A man in a tuxedo stands on a stage.",
    "signal": "Embrace your individuality and express yourself confidently.",
    "shadow": "Fear of judgment may hold you back from showcasing your talents.",
    "directive": "Cultivate your unique voice and share it with others.",
    "practice": "Engage in a creative activity that allows for self-expression, such as writing or performing.",
    "journal": "What aspects of yourself do you hesitate to share with the world?",
    "tags": [
      "self-expression",
      "confidence",
      "creativity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 85,
<<<<<<< Updated upstream
    "key": "Gemini 26",
    "sign": "Gemini",
    "degree": 26,
    "symbol": "Sustain: A information and framing moment is on the table.",
    "signal": "Make it last. Emphasize clarify.",
    "shadow": "Burnout follows spikes. Watch for scatter.",
    "directive": "Sustain. Keep it information and framing.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "clarify",
      "sustain",
      "focus"
=======
    "key": "Gemini_26",
    "sign": "Gemini",
    "degree": 26,
    "symbol": "A woman reading a book in a cozy nook.",
    "signal": "Seek knowledge and understanding through introspection.",
    "shadow": "Overthinking can lead to confusion and indecision.",
    "directive": "Dedicate time to study a subject that fascinates you.",
    "practice": "Create a reading schedule that allows you to explore new ideas regularly.",
    "journal": "What knowledge do you wish to acquire, and why is it important to you?",
    "tags": [
      "knowledge",
      "introspection",
      "learning"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 86,
<<<<<<< Updated upstream
    "key": "Gemini 27",
    "sign": "Gemini",
    "degree": 27,
    "symbol": "Legacy: A information and framing moment is on the table.",
    "signal": "Long-term view matters. Emphasize clarify.",
    "shadow": "Short-term ego derails. Watch for scatter.",
    "directive": "Think long. Keep it information and framing.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "clarify",
      "legacy",
      "stewardship"
=======
    "key": "Gemini_27",
    "sign": "Gemini",
    "degree": 27,
    "symbol": "A group of friends sharing a meal.",
    "signal": "Nurture connections through shared experiences.",
    "shadow": "Neglecting relationships can lead to feelings of isolation.",
    "directive": "Plan a gathering to strengthen your bonds with friends or family.",
    "practice": "Cook a meal together or share stories that deepen your connections.",
    "journal": "Who in your life deserves more of your attention and gratitude?",
    "tags": [
      "relationships",
      "community",
      "connection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 87,
<<<<<<< Updated upstream
    "key": "Gemini 28",
    "sign": "Gemini",
    "degree": 28,
    "symbol": "Closure: A information and framing moment is on the table.",
    "signal": "Finish cycles. Emphasize clarify.",
    "shadow": "Open loops drain attention. Watch for scatter.",
    "directive": "Close the loop. Keep it information and framing.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "focus",
      "clarify"
=======
    "key": "Gemini_28",
    "sign": "Gemini",
    "degree": 28,
    "symbol": "A child playing with a kite.",
    "signal": "Embrace a sense of playfulness and freedom.",
    "shadow": "Taking life too seriously can stifle your joy.",
    "directive": "Incorporate fun and spontaneity into your daily routine.",
    "practice": "Engage in a playful activity that brings you joy, like drawing or playing a game.",
    "journal": "When was the last time you felt truly carefree, and how can you recreate that feeling?",
    "tags": [
      "playfulness",
      "freedom",
      "joy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 88,
<<<<<<< Updated upstream
    "key": "Gemini 29",
    "sign": "Gemini",
    "degree": 29,
    "symbol": "Threshold: A information and framing moment is on the table.",
    "signal": "A transition is near. Emphasize clarify.",
    "shadow": "Hesitation creates drift. Watch for scatter.",
    "directive": "Cross the threshold. Keep it information and framing.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "clarify",
      "focus"
=======
    "key": "Gemini_29",
    "sign": "Gemini",
    "degree": 29,
    "symbol": "A wise elder sharing stories.",
    "signal": "Value the wisdom gained from experiences.",
    "shadow": "Ignoring lessons from the past can lead to repeated mistakes.",
    "directive": "Reflect on past experiences to extract valuable insights.",
    "practice": "Write down a lesson learned from a challenging situation and how it shaped you.",
    "journal": "What wisdom have you gained that you can share with others?",
    "tags": [
      "wisdom",
      "reflection",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 89,
<<<<<<< Updated upstream
    "key": "Gemini 30",
    "sign": "Gemini",
    "degree": 30,
    "symbol": "Completion: A information and framing moment is on the table.",
    "signal": "Harvest the result. Emphasize clarify.",
    "shadow": "Skipping review repeats mistakes. Watch for scatter.",
    "directive": "Complete and review. Keep it information and framing.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "clarify",
      "focus",
      "completion"
=======
    "key": "Gemini_30",
    "sign": "Gemini",
    "degree": 30,
    "symbol": "A butterfly emerging from a cocoon.",
    "signal": "Embrace transformation and personal growth.",
    "shadow": "Resistance to change can hinder your progress.",
    "directive": "Identify areas in your life where you seek transformation.",
    "practice": "Set specific goals for personal development and take actionable steps towards them.",
    "journal": "What transformation are you currently undergoing, and how can you support it?",
    "tags": [
      "transformation",
      "growth",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 90,
<<<<<<< Updated upstream
    "key": "Cancer 1",
    "sign": "Cancer",
    "degree": 1,
    "symbol": "Start: A care and preparation moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize secure.",
    "shadow": "Rushing creates rework. Watch for overprotection.",
    "directive": "Start small and make it real. Keep it care and preparation.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "secure",
      "start",
      "focus"
=======
    "key": "Cancer_1",
    "sign": "Cancer",
    "degree": 1,
    "symbol": "A mother nurturing her child.",
    "signal": "Prioritize care and emotional support for yourself and others.",
    "shadow": "Neglecting self-care can lead to burnout.",
    "directive": "Create a nurturing environment that fosters emotional well-being.",
    "practice": "Engage in self-care routines that replenish your energy and spirit.",
    "journal": "How do you nurture yourself, and how can you improve this practice?",
    "tags": [
      "nurturing",
      "self-care",
      "emotional support"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 91,
<<<<<<< Updated upstream
    "key": "Cancer 2",
    "sign": "Cancer",
    "degree": 2,
    "symbol": "Choice: A care and preparation moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize secure.",
    "shadow": "Keeping both dilutes effort. Watch for overprotection.",
    "directive": "Pick one lane and commit. Keep it care and preparation.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "secure",
      "focus"
=======
    "key": "Cancer_2",
    "sign": "Cancer",
    "degree": 2,
    "symbol": "A family gathered around a fireplace.",
    "signal": "Strengthen familial bonds and create a sense of belonging.",
    "shadow": "Taking family for granted can lead to disconnection.",
    "directive": "Invest time in family activities that reinforce your connections.",
    "practice": "Plan a family night or a weekend outing to foster unity.",
    "journal": "What traditions or values do you cherish most in your family?",
    "tags": [
      "family",
      "belonging",
      "tradition"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 92,
<<<<<<< Updated upstream
    "key": "Cancer 3",
    "sign": "Cancer",
    "degree": 3,
    "symbol": "Signal: A care and preparation moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize secure.",
    "shadow": "Noise hides the point. Watch for overprotection.",
    "directive": "Name the signal and ignore the rest. Keep it care and preparation.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "secure",
      "focus",
      "signal"
=======
    "key": "Cancer_3",
    "sign": "Cancer",
    "degree": 3,
    "symbol": "A gardener tending to a blooming garden.",
    "signal": "Nurture your personal projects and watch them flourish.",
    "shadow": "Neglecting your passions can lead to stagnation.",
    "directive": "Dedicate time to cultivate your interests and hobbies.",
    "practice": "Create a plan to develop a personal project that excites you.",
    "journal": "What passion project have you been neglecting, and how can you revive it?",
    "tags": [
      "nurturing",
      "growth",
      "passion"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 93,
<<<<<<< Updated upstream
    "key": "Cancer 4",
    "sign": "Cancer",
    "degree": 4,
    "symbol": "Structure: A care and preparation moment is on the table.",
    "signal": "A stable frame is needed. Emphasize secure.",
    "shadow": "Improvisation without a base collapses. Watch for overprotection.",
    "directive": "Build the container first. Keep it care and preparation.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "secure",
      "focus",
      "structure"
=======
    "key": "Cancer_4",
    "sign": "Cancer",
    "degree": 4,
    "symbol": "A child building a sandcastle.",
    "signal": "Embrace creativity and imagination in your endeavors.",
    "shadow": "Fear of failure can stifle your creative expression.",
    "directive": "Allow yourself to experiment and play with new ideas.",
    "practice": "Engage in a creative activity without the pressure of perfection.",
    "journal": "What creative pursuits have you been hesitant to explore, and why?",
    "tags": [
      "creativity",
      "imagination",
      "play"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 94,
<<<<<<< Updated upstream
    "key": "Cancer 5",
    "sign": "Cancer",
    "degree": 5,
    "symbol": "Craft: A care and preparation moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize secure.",
    "shadow": "Overthinking delays practice. Watch for overprotection.",
    "directive": "Practice the fundamentals. Keep it care and preparation.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "secure",
      "focus"
=======
    "key": "Cancer_5",
    "sign": "Cancer",
    "degree": 5,
    "symbol": "A boat sailing on calm waters.",
    "signal": "Seek tranquility and peace in your life.",
    "shadow": "Chaos and stress can disrupt your inner harmony.",
    "directive": "Create a peaceful space for reflection and relaxation.",
    "practice": "Incorporate mindfulness or meditation practices into your daily routine.",
    "journal": "What brings you peace, and how can you incorporate more of it into your life?",
    "tags": [
      "peace",
      "tranquility",
      "mindfulness"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 95,
<<<<<<< Updated upstream
    "key": "Cancer 6",
    "sign": "Cancer",
    "degree": 6,
    "symbol": "Order: A care and preparation moment is on the table.",
    "signal": "Details want sorting. Emphasize secure.",
    "shadow": "Perfectionism blocks delivery. Watch for overprotection.",
    "directive": "Organize, then ship. Keep it care and preparation.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "secure",
      "order",
      "focus"
=======
    "key": "Cancer_6",
    "sign": "Cancer",
    "degree": 6,
    "symbol": "A family tree with deep roots.",
    "signal": "Honor your heritage and the connections that shape you.",
    "shadow": "Ignoring your roots can lead to a disconnection from your identity.",
    "directive": "Explore your family history and its impact on your life.",
    "practice": "Create a family tree or journal about your ancestors and their stories.",
    "journal": "How do your roots influence who you are today?",
    "tags": [
      "heritage",
      "identity",
      "family"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 96,
    "key": "Cancer 7",
    "sign": "Cancer",
    "degree": 7,
<<<<<<< Updated upstream
    "symbol": "Terms: A care and preparation moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize secure.",
    "shadow": "Avoiding terms breeds friction. Watch for overprotection.",
    "directive": "State expectations plainly. Keep it care and preparation.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "secure",
      "terms",
      "focus"
=======
    "symbol": "A family gathering around a table.",
    "signal": "Emphasizes the importance of community and connection.",
    "shadow": "Tendency to cling to past grievances.",
    "directive": "Foster open communication within your family.",
    "practice": "Host a gathering to strengthen bonds and share experiences.",
    "journal": "What unresolved issues do I need to address with my family?",
    "tags": [
      "family",
      "communication",
      "community"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 97,
    "key": "Cancer 8",
    "sign": "Cancer",
    "degree": 8,
<<<<<<< Updated upstream
    "symbol": "Depth: A care and preparation moment is on the table.",
    "signal": "A hidden factor matters. Emphasize secure.",
    "shadow": "Control replaces honesty. Watch for overprotection.",
    "directive": "Confront the real issue. Keep it care and preparation.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "secure",
      "depth",
      "focus"
=======
    "symbol": "A child playing with a toy.",
    "signal": "Encourages creativity and playfulness.",
    "shadow": "Risk of becoming overly serious or burdened.",
    "directive": "Make time for play and creative expression.",
    "practice": "Engage in a playful activity that brings you joy.",
    "journal": "When was the last time I allowed myself to play?",
    "tags": [
      "creativity",
      "play",
      "joy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 98,
    "key": "Cancer 9",
    "sign": "Cancer",
    "degree": 9,
<<<<<<< Updated upstream
    "symbol": "Aim: A care and preparation moment is on the table.",
    "signal": "A goal needs meaning. Emphasize secure.",
    "shadow": "Drift wastes time. Watch for overprotection.",
    "directive": "Choose direction. Keep it care and preparation.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "focus",
      "secure"
=======
    "symbol": "A lighthouse guiding ships.",
    "signal": "Highlights the role of guidance and support.",
    "shadow": "Fear of being lost or directionless.",
    "directive": "Be a source of support for someone in need.",
    "practice": "Reach out to offer help or guidance to a friend.",
    "journal": "Who in my life could use my guidance right now?",
    "tags": [
      "guidance",
      "support",
      "community"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 99,
    "key": "Cancer 10",
    "sign": "Cancer",
    "degree": 10,
<<<<<<< Updated upstream
    "symbol": "Ledger: A care and preparation moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize secure.",
    "shadow": "Self-worth ties to output. Watch for overprotection.",
    "directive": "Measure and adjust. Keep it care and preparation.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "secure",
      "ledger",
      "stewardship"
=======
    "symbol": "A garden in full bloom.",
    "signal": "Represents growth and nurturing.",
    "shadow": "Neglecting personal growth for others' needs.",
    "directive": "Invest time in your personal development.",
    "practice": "Start a new project that nurtures your skills or passions.",
    "journal": "What aspect of my life needs more nurturing?",
    "tags": [
      "growth",
      "nurturing",
      "development"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 100,
    "key": "Cancer 11",
    "sign": "Cancer",
    "degree": 11,
<<<<<<< Updated upstream
    "symbol": "Network: A care and preparation moment is on the table.",
    "signal": "Support systems matter. Emphasize secure.",
    "shadow": "Isolation becomes a habit. Watch for overprotection.",
    "directive": "Share the plan. Keep it care and preparation.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "secure",
      "focus",
      "network"
=======
    "symbol": "A mother hen with her chicks.",
    "signal": "Emphasizes protection and care.",
    "shadow": "Overprotectiveness that stifles independence.",
    "directive": "Balance care with the encouragement of independence.",
    "practice": "Support someone in taking a step towards independence.",
    "journal": "How can I support others while allowing them to grow?",
    "tags": [
      "protection",
      "care",
      "independence"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 101,
    "key": "Cancer 12",
    "sign": "Cancer",
    "degree": 12,
<<<<<<< Updated upstream
    "symbol": "Reset: A care and preparation moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize secure.",
    "shadow": "Escaping replaces rest. Watch for overprotection.",
    "directive": "Pause and return with intent. Keep it care and preparation.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "secure",
      "focus",
      "reset"
=======
    "symbol": "A ship sailing into the sunset.",
    "signal": "Represents new beginnings and transitions.",
    "shadow": "Fear of change or the unknown.",
    "directive": "Embrace transitions as opportunities for growth.",
    "practice": "Reflect on a recent change and identify its benefits.",
    "journal": "What changes am I resisting, and why?",
    "tags": [
      "transitions",
      "change",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 102,
    "key": "Cancer 13",
    "sign": "Cancer",
    "degree": 13,
<<<<<<< Updated upstream
    "symbol": "Commit: A care and preparation moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize secure.",
    "shadow": "Half-commitment drains energy. Watch for overprotection.",
    "directive": "Commit fully. Keep it care and preparation.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "secure",
      "commit",
      "focus"
=======
    "symbol": "An artist painting a mural.",
    "signal": "Highlights the importance of self-expression.",
    "shadow": "Fear of judgment or criticism stifling creativity.",
    "directive": "Express yourself freely without fear of judgment.",
    "practice": "Create a piece of art or write something personal.",
    "journal": "What fears hold me back from expressing my true self?",
    "tags": [
      "self-expression",
      "creativity",
      "art"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 103,
    "key": "Cancer 14",
    "sign": "Cancer",
    "degree": 14,
<<<<<<< Updated upstream
    "symbol": "Boundaries: A care and preparation moment is on the table.",
    "signal": "Limits protect value. Emphasize secure.",
    "shadow": "Saying yes too fast costs you. Watch for overprotection.",
    "directive": "Set a boundary. Keep it care and preparation.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "secure",
      "focus"
=======
    "symbol": "A cozy home filled with laughter.",
    "signal": "Emphasizes the warmth of home and family.",
    "shadow": "Neglecting personal needs for the sake of others.",
    "directive": "Create a nurturing environment for yourself and others.",
    "practice": "Plan a cozy evening at home with loved ones.",
    "journal": "How can I make my home feel more nurturing?",
    "tags": [
      "home",
      "family",
      "nurturing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 104,
    "key": "Cancer 15",
    "sign": "Cancer",
    "degree": 15,
<<<<<<< Updated upstream
    "symbol": "Mirror: A care and preparation moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize secure.",
    "shadow": "Defensiveness blocks learning. Watch for overprotection.",
    "directive": "Take the note. Keep it care and preparation.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "focus",
      "secure"
=======
    "symbol": "A wise elder sharing stories.",
    "signal": "Represents the value of wisdom and experience.",
    "shadow": "Ignoring the lessons of the past.",
    "directive": "Seek wisdom from your experiences and those of others.",
    "practice": "Share a lesson learned with someone who can benefit.",
    "journal": "What wisdom have I gained from my life experiences?",
    "tags": [
      "wisdom",
      "experience",
      "learning"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 105,
    "key": "Cancer 16",
    "sign": "Cancer",
    "degree": 16,
<<<<<<< Updated upstream
    "symbol": "Repair: A care and preparation moment is on the table.",
    "signal": "Something wants fixing. Emphasize secure.",
    "shadow": "Avoidance compounds cost. Watch for overprotection.",
    "directive": "Repair it. Keep it care and preparation.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "secure",
      "focus",
      "repair"
=======
    "symbol": "A family tree with deep roots.",
    "signal": "Highlights the importance of heritage and lineage.",
    "shadow": "Disconnection from one's roots and history.",
    "directive": "Explore your family history and its impact on you.",
    "practice": "Research your ancestry or share family stories.",
    "journal": "How does my family history shape who I am today?",
    "tags": [
      "heritage",
      "family",
      "roots"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 106,
    "key": "Cancer 17",
    "sign": "Cancer",
    "degree": 17,
<<<<<<< Updated upstream
    "symbol": "Focus: A care and preparation moment is on the table.",
    "signal": "Attention is currency. Emphasize secure.",
    "shadow": "Multitasking reduces quality. Watch for overprotection.",
    "directive": "Single-task. Keep it care and preparation.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "secure"
=======
    "symbol": "A nurturing garden tended with care.",
    "signal": "Represents the cultivation of relationships.",
    "shadow": "Neglecting relationships due to busyness.",
    "directive": "Prioritize nurturing your relationships.",
    "practice": "Reach out to a friend or family member you haven't connected with recently.",
    "journal": "Which relationships need more attention in my life?",
    "tags": [
      "relationships",
      "nurturing",
      "care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 107,
    "key": "Cancer 18",
    "sign": "Cancer",
    "degree": 18,
<<<<<<< Updated upstream
    "symbol": "Standard: A care and preparation moment is on the table.",
    "signal": "Quality needs definition. Emphasize secure.",
    "shadow": "Vague standards create stress. Watch for overprotection.",
    "directive": "Define the standard. Keep it care and preparation.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "secure",
      "focus",
      "standard"
=======
    "symbol": "A river flowing gently through a valley.",
    "signal": "Represents the flow of emotions and intuition.",
    "shadow": "Resistance to emotional expression.",
    "directive": "Allow your emotions to flow freely and be expressed.",
    "practice": "Engage in a practice that allows emotional release, like journaling or art.",
    "journal": "What emotions am I currently holding back, and why?",
    "tags": [
      "emotions",
      "intuition",
      "expression"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 108,
<<<<<<< Updated upstream
    "key": "Cancer 19",
    "sign": "Cancer",
    "degree": 19,
    "symbol": "Tempo: A care and preparation moment is on the table.",
    "signal": "Timing matters. Emphasize secure.",
    "shadow": "Forcing pace breaks form. Watch for overprotection.",
    "directive": "Set the pace. Keep it care and preparation.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "secure",
      "tempo",
      "focus"
=======
    "key": "Cancer_19",
    "sign": "Cancer",
    "degree": 19,
    "symbol": "A child playing with a toy boat.",
    "signal": "Embrace creativity and playfulness.",
    "shadow": "Avoid getting lost in distractions.",
    "directive": "Nurture your inner child and allow yourself moments of joy.",
    "practice": "Engage in a playful activity that brings you happiness.",
    "journal": "What brings you joy and how can you incorporate more of it into your life?",
    "tags": [
      "creativity",
      "playfulness",
      "joy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 109,
<<<<<<< Updated upstream
    "key": "Cancer 20",
    "sign": "Cancer",
    "degree": 20,
    "symbol": "Risk: A care and preparation moment is on the table.",
    "signal": "A calculated step is required. Emphasize secure.",
    "shadow": "Impulse risk is not courage. Watch for overprotection.",
    "directive": "Take a measured risk. Keep it care and preparation.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "secure",
      "focus",
      "risk"
=======
    "key": "Cancer_20",
    "sign": "Cancer",
    "degree": 20,
    "symbol": "A family gathering around a table.",
    "signal": "Strengthen bonds with loved ones.",
    "shadow": "Neglecting personal needs for others.",
    "directive": "Prioritize family connections and shared experiences.",
    "practice": "Organize a meal or gathering with family or close friends.",
    "journal": "How do your relationships nourish you, and what can you do to enhance them?",
    "tags": [
      "family",
      "connection",
      "nourishment"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 110,
<<<<<<< Updated upstream
    "key": "Cancer 21",
    "sign": "Cancer",
    "degree": 21,
    "symbol": "Integration: A care and preparation moment is on the table.",
    "signal": "Pieces want alignment. Emphasize secure.",
    "shadow": "Fragmentation creates fatigue. Watch for overprotection.",
    "directive": "Integrate. Keep it care and preparation.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "secure",
      "focus"
=======
    "key": "Cancer_21",
    "sign": "Cancer",
    "degree": 21,
    "symbol": "A person gazing at the ocean.",
    "signal": "Seek emotional depth and reflection.",
    "shadow": "Fear of confronting deeper feelings.",
    "directive": "Take time to reflect on your emotional landscape.",
    "practice": "Spend time near water or in a quiet space for contemplation.",
    "journal": "What emotions are you currently avoiding, and how can you face them?",
    "tags": [
      "reflection",
      "emotions",
      "depth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 111,
<<<<<<< Updated upstream
    "key": "Cancer 22",
    "sign": "Cancer",
    "degree": 22,
    "symbol": "Authority: A care and preparation moment is on the table.",
    "signal": "Own responsibility. Emphasize secure.",
    "shadow": "Blame delays progress. Watch for overprotection.",
    "directive": "Take ownership. Keep it care and preparation.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "secure",
      "authority",
      "focus"
=======
    "key": "Cancer_22",
    "sign": "Cancer",
    "degree": 22,
    "symbol": "A mother caring for her child.",
    "signal": "Emphasize nurturing and support.",
    "shadow": "Overextending yourself for others.",
    "directive": "Balance self-care with caring for others.",
    "practice": "Set aside time for self-nurturing activities.",
    "journal": "In what ways can you better care for yourself while supporting others?",
    "tags": [
      "nurturing",
      "self-care",
      "balance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 112,
<<<<<<< Updated upstream
    "key": "Cancer 23",
    "sign": "Cancer",
    "degree": 23,
    "symbol": "Refine: A care and preparation moment is on the table.",
    "signal": "Polish after completion. Emphasize secure.",
    "shadow": "Editing before finishing stalls. Watch for overprotection.",
    "directive": "Refine the finished draft. Keep it care and preparation.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "focus",
      "secure"
=======
    "key": "Cancer_23",
    "sign": "Cancer",
    "degree": 23,
    "symbol": "A garden in full bloom.",
    "signal": "Cultivate growth and beauty in your life.",
    "shadow": "Neglecting the care of your personal space.",
    "directive": "Invest time in nurturing your environment.",
    "practice": "Tend to a plant or create a small garden space.",
    "journal": "What aspects of your life need more attention and care to flourish?",
    "tags": [
      "growth",
      "beauty",
      "environment"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 113,
<<<<<<< Updated upstream
    "key": "Cancer 24",
    "sign": "Cancer",
    "degree": 24,
    "symbol": "Stewardship: A care and preparation moment is on the table.",
    "signal": "Resources need care. Emphasize secure.",
    "shadow": "Waste hides in habits. Watch for overprotection.",
    "directive": "Protect resources. Keep it care and preparation.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "secure",
      "stewardship"
=======
    "key": "Cancer_24",
    "sign": "Cancer",
    "degree": 24,
    "symbol": "A lighthouse guiding ships.",
    "signal": "Provide guidance and support to others.",
    "shadow": "Feeling lost in your own direction.",
    "directive": "Be a source of light and clarity for those around you.",
    "practice": "Offer help or advice to someone in need.",
    "journal": "How can you be a guiding light in your community or for someone close to you?",
    "tags": [
      "guidance",
      "support",
      "community"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 114,
<<<<<<< Updated upstream
    "key": "Cancer 25",
    "sign": "Cancer",
    "degree": 25,
    "symbol": "Signal-to-noise: A care and preparation moment is on the table.",
    "signal": "Simplify inputs. Emphasize secure.",
    "shadow": "Overconsumption clouds judgment. Watch for overprotection.",
    "directive": "Reduce intake. Keep it care and preparation.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "secure",
      "focus"
=======
    "key": "Cancer_25",
    "sign": "Cancer",
    "degree": 25,
    "symbol": "A cozy home filled with warmth.",
    "signal": "Create a safe and nurturing space.",
    "shadow": "Clinging to comfort at the expense of growth.",
    "directive": "Make your living space reflect your inner warmth.",
    "practice": "Redecorate or reorganize a space to enhance comfort.",
    "journal": "What changes can you make to your environment to feel more at home?",
    "tags": [
      "home",
      "comfort",
      "nurturing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 115,
<<<<<<< Updated upstream
    "key": "Cancer 26",
    "sign": "Cancer",
    "degree": 26,
    "symbol": "Sustain: A care and preparation moment is on the table.",
    "signal": "Make it last. Emphasize secure.",
    "shadow": "Burnout follows spikes. Watch for overprotection.",
    "directive": "Sustain. Keep it care and preparation.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "secure",
      "sustain",
      "focus"
=======
    "key": "Cancer_26",
    "sign": "Cancer",
    "degree": 26,
    "symbol": "A ship setting sail.",
    "signal": "Embrace new adventures and journeys.",
    "shadow": "Fear of leaving your comfort zone.",
    "directive": "Be open to new experiences and opportunities.",
    "practice": "Plan a trip or an outing to explore somewhere new.",
    "journal": "What adventure have you been longing to embark on, and what's holding you back?",
    "tags": [
      "adventure",
      "exploration",
      "new experiences"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 116,
<<<<<<< Updated upstream
    "key": "Cancer 27",
    "sign": "Cancer",
    "degree": 27,
    "symbol": "Legacy: A care and preparation moment is on the table.",
    "signal": "Long-term view matters. Emphasize secure.",
    "shadow": "Short-term ego derails. Watch for overprotection.",
    "directive": "Think long. Keep it care and preparation.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "secure",
      "legacy",
      "stewardship"
=======
    "key": "Cancer_27",
    "sign": "Cancer",
    "degree": 27,
    "symbol": "A wise elder sharing stories.",
    "signal": "Value wisdom and shared experiences.",
    "shadow": "Ignoring the lessons of the past.",
    "directive": "Seek out wisdom from those who have more experience.",
    "practice": "Engage in conversations with elders or mentors.",
    "journal": "What lessons from your past can you apply to your current situation?",
    "tags": [
      "wisdom",
      "experience",
      "learning"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 117,
<<<<<<< Updated upstream
    "key": "Cancer 28",
    "sign": "Cancer",
    "degree": 28,
    "symbol": "Closure: A care and preparation moment is on the table.",
    "signal": "Finish cycles. Emphasize secure.",
    "shadow": "Open loops drain attention. Watch for overprotection.",
    "directive": "Close the loop. Keep it care and preparation.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "focus",
      "secure"
=======
    "key": "Cancer_28",
    "sign": "Cancer",
    "degree": 28,
    "symbol": "A family tree with deep roots.",
    "signal": "Honor your heritage and lineage.",
    "shadow": "Feeling disconnected from your roots.",
    "directive": "Explore your ancestry and family history.",
    "practice": "Create a family tree or gather stories from relatives.",
    "journal": "How does your family history shape who you are today?",
    "tags": [
      "heritage",
      "roots",
      "family history"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 118,
<<<<<<< Updated upstream
    "key": "Cancer 29",
    "sign": "Cancer",
    "degree": 29,
    "symbol": "Threshold: A care and preparation moment is on the table.",
    "signal": "A transition is near. Emphasize secure.",
    "shadow": "Hesitation creates drift. Watch for overprotection.",
    "directive": "Cross the threshold. Keep it care and preparation.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "secure",
      "focus"
=======
    "key": "Cancer_29",
    "sign": "Cancer",
    "degree": 29,
    "symbol": "A full moon illuminating the night sky.",
    "signal": "Embrace emotional clarity and intuition.",
    "shadow": "Being overwhelmed by emotions.",
    "directive": "Trust your intuition and emotional insights.",
    "practice": "Spend time in meditation or journaling to connect with your feelings.",
    "journal": "What insights are your emotions trying to reveal to you?",
    "tags": [
      "intuition",
      "clarity",
      "emotions"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 119,
<<<<<<< Updated upstream
    "key": "Cancer 30",
    "sign": "Cancer",
    "degree": 30,
    "symbol": "Completion: A care and preparation moment is on the table.",
    "signal": "Harvest the result. Emphasize secure.",
    "shadow": "Skipping review repeats mistakes. Watch for overprotection.",
    "directive": "Complete and review. Keep it care and preparation.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "secure",
      "focus",
      "completion"
=======
    "key": "Cancer_30",
    "sign": "Cancer",
    "degree": 30,
    "symbol": "A door opening to a new path.",
    "signal": "Prepare for new beginnings and opportunities.",
    "shadow": "Resisting change and staying stagnant.",
    "directive": "Be ready to embrace change and new opportunities.",
    "practice": "Identify one area of your life where you can initiate change.",
    "journal": "What new path are you ready to explore, and what steps will you take?",
    "tags": [
      "new beginnings",
      "change",
      "opportunity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 120,
<<<<<<< Updated upstream
    "key": "Leo 1",
    "sign": "Leo",
    "degree": 1,
    "symbol": "Start: A ownership and visibility moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize present.",
    "shadow": "Rushing creates rework. Watch for approval-seeking.",
    "directive": "Start small and make it real. Keep it ownership and visibility.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "focus",
      "start",
      "present"
=======
    "key": "Leo1",
    "sign": "Leo",
    "degree": 1,
    "symbol": "A lion in a sunlit field.",
    "signal": "Embrace your inner strength and confidence.",
    "shadow": "Avoid arrogance and overconfidence.",
    "directive": "Cultivate self-awareness and humility.",
    "practice": "Spend time reflecting on your achievements and how they impact others.",
    "journal": "In what ways can I celebrate my strengths without overshadowing others?",
    "tags": [
      "confidence",
      "self-awareness",
      "strength"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 121,
<<<<<<< Updated upstream
    "key": "Leo 2",
    "sign": "Leo",
    "degree": 2,
    "symbol": "Choice: A ownership and visibility moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize present.",
    "shadow": "Keeping both dilutes effort. Watch for approval-seeking.",
    "directive": "Pick one lane and commit. Keep it ownership and visibility.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "focus",
      "present"
=======
    "key": "Leo2",
    "sign": "Leo",
    "degree": 2,
    "symbol": "A roaring lion.",
    "signal": "Express your truth boldly.",
    "shadow": "Beware of being overly aggressive or dominating.",
    "directive": "Communicate your ideas with clarity and passion.",
    "practice": "Practice assertive communication in a safe space.",
    "journal": "How can I express my opinions while being open to others' perspectives?",
    "tags": [
      "communication",
      "assertiveness",
      "truth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 122,
<<<<<<< Updated upstream
    "key": "Leo 3",
    "sign": "Leo",
    "degree": 3,
    "symbol": "Signal: A ownership and visibility moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize present.",
    "shadow": "Noise hides the point. Watch for approval-seeking.",
    "directive": "Name the signal and ignore the rest. Keep it ownership and visibility.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "focus",
      "present",
      "signal"
=======
    "key": "Leo3",
    "sign": "Leo",
    "degree": 3,
    "symbol": "A vibrant sunset.",
    "signal": "Recognize the beauty in transitions.",
    "shadow": "Fear change and resist letting go.",
    "directive": "Embrace the cycles of life and your role within them.",
    "practice": "Create a ritual to honor endings and new beginnings.",
    "journal": "What transitions am I currently facing, and how can I embrace them?",
    "tags": [
      "transition",
      "change",
      "embrace"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 123,
<<<<<<< Updated upstream
    "key": "Leo 4",
    "sign": "Leo",
    "degree": 4,
    "symbol": "Structure: A ownership and visibility moment is on the table.",
    "signal": "A stable frame is needed. Emphasize present.",
    "shadow": "Improvisation without a base collapses. Watch for approval-seeking.",
    "directive": "Build the container first. Keep it ownership and visibility.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "focus",
      "structure",
      "present"
=======
    "key": "Leo4",
    "sign": "Leo",
    "degree": 4,
    "symbol": "A proud peacock displaying its feathers.",
    "signal": "Showcase your unique talents.",
    "shadow": "Avoid seeking validation through comparison.",
    "directive": "Celebrate your individuality without needing external approval.",
    "practice": "Create a portfolio or showcase of your talents.",
    "journal": "What makes me unique, and how can I share that with the world?",
    "tags": [
      "individuality",
      "talent",
      "celebration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 124,
<<<<<<< Updated upstream
    "key": "Leo 5",
    "sign": "Leo",
    "degree": 5,
    "symbol": "Craft: A ownership and visibility moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize present.",
    "shadow": "Overthinking delays practice. Watch for approval-seeking.",
    "directive": "Practice the fundamentals. Keep it ownership and visibility.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "focus",
      "present"
=======
    "key": "Leo5",
    "sign": "Leo",
    "degree": 5,
    "symbol": "A group of children playing.",
    "signal": "Embrace joy and playfulness.",
    "shadow": "Neglect responsibilities in pursuit of fun.",
    "directive": "Find a balance between work and play.",
    "practice": "Schedule regular time for activities that bring you joy.",
    "journal": "How can I incorporate more playfulness into my daily routine?",
    "tags": [
      "joy",
      "playfulness",
      "balance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 125,
<<<<<<< Updated upstream
    "key": "Leo 6",
    "sign": "Leo",
    "degree": 6,
    "symbol": "Order: A ownership and visibility moment is on the table.",
    "signal": "Details want sorting. Emphasize present.",
    "shadow": "Perfectionism blocks delivery. Watch for approval-seeking.",
    "directive": "Organize, then ship. Keep it ownership and visibility.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "focus",
      "order",
      "present"
=======
    "key": "Leo6",
    "sign": "Leo",
    "degree": 6,
    "symbol": "A majestic castle.",
    "signal": "Build a strong foundation for your dreams.",
    "shadow": "Fear of failure may hinder progress.",
    "directive": "Establish clear goals and a plan to achieve them.",
    "practice": "Create a vision board to visualize your aspirations.",
    "journal": "What steps can I take today to move closer to my dreams?",
    "tags": [
      "dreams",
      "foundation",
      "goals"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 126,
<<<<<<< Updated upstream
    "key": "Leo 7",
    "sign": "Leo",
    "degree": 7,
    "symbol": "Terms: A ownership and visibility moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize present.",
    "shadow": "Avoiding terms breeds friction. Watch for approval-seeking.",
    "directive": "State expectations plainly. Keep it ownership and visibility.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "focus",
      "terms",
      "present"
=======
    "key": "Leo7",
    "sign": "Leo",
    "degree": 7,
    "symbol": "A radiant sun.",
    "signal": "Shine your light and inspire others.",
    "shadow": "Avoid dimming your light out of fear of judgment.",
    "directive": "Use your influence positively in your community.",
    "practice": "Volunteer or mentor someone in need.",
    "journal": "In what ways can I positively impact those around me?",
    "tags": [
      "inspiration",
      "community",
      "light"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 127,
<<<<<<< Updated upstream
    "key": "Leo 8",
    "sign": "Leo",
    "degree": 8,
    "symbol": "Depth: A ownership and visibility moment is on the table.",
    "signal": "A hidden factor matters. Emphasize present.",
    "shadow": "Control replaces honesty. Watch for approval-seeking.",
    "directive": "Confront the real issue. Keep it ownership and visibility.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "focus",
      "depth",
      "present"
=======
    "key": "Leo8",
    "sign": "Leo",
    "degree": 8,
    "symbol": "A stage with a spotlight.",
    "signal": "Take center stage in your life.",
    "shadow": "Fear of public speaking or being seen.",
    "directive": "Step out of your comfort zone and share your voice.",
    "practice": "Join a public speaking group or workshop.",
    "journal": "What fears hold me back from expressing myself fully?",
    "tags": [
      "expression",
      "public speaking",
      "courage"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 128,
<<<<<<< Updated upstream
    "key": "Leo 9",
    "sign": "Leo",
    "degree": 9,
    "symbol": "Aim: A ownership and visibility moment is on the table.",
    "signal": "A goal needs meaning. Emphasize present.",
    "shadow": "Drift wastes time. Watch for approval-seeking.",
    "directive": "Choose direction. Keep it ownership and visibility.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "focus",
      "present"
=======
    "key": "Leo9",
    "sign": "Leo",
    "degree": 9,
    "symbol": "A lioness nurturing her cubs.",
    "signal": "Emphasize care and protection in your relationships.",
    "shadow": "Overprotectiveness may stifle growth.",
    "directive": "Support others while allowing them to grow independently.",
    "practice": "Practice active listening and empathy in conversations.",
    "journal": "How can I support others while respecting their autonomy?",
    "tags": [
      "nurturing",
      "relationships",
      "support"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 129,
<<<<<<< Updated upstream
    "key": "Leo 10",
    "sign": "Leo",
    "degree": 10,
    "symbol": "Ledger: A ownership and visibility moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize present.",
    "shadow": "Self-worth ties to output. Watch for approval-seeking.",
    "directive": "Measure and adjust. Keep it ownership and visibility.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "ledger",
      "stewardship",
      "present"
=======
    "key": "Leo10",
    "sign": "Leo",
    "degree": 10,
    "symbol": "A vibrant garden in full bloom.",
    "signal": "Cultivate your passions and interests.",
    "shadow": "Neglecting self-care can lead to burnout.",
    "directive": "Invest time in activities that nourish your spirit.",
    "practice": "Create a self-care routine that includes your favorite hobbies.",
    "journal": "What passions have I neglected, and how can I reintegrate them into my life?",
    "tags": [
      "self-care",
      "passion",
      "nourishment"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 130,
<<<<<<< Updated upstream
    "key": "Leo 11",
    "sign": "Leo",
    "degree": 11,
    "symbol": "Network: A ownership and visibility moment is on the table.",
    "signal": "Support systems matter. Emphasize present.",
    "shadow": "Isolation becomes a habit. Watch for approval-seeking.",
    "directive": "Share the plan. Keep it ownership and visibility.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "present",
      "focus",
      "network"
=======
    "key": "Leo11",
    "sign": "Leo",
    "degree": 11,
    "symbol": "A theatrical performance.",
    "signal": "Express creativity in various forms.",
    "shadow": "Fear of judgment may limit creative expression.",
    "directive": "Explore different artistic outlets without self-criticism.",
    "practice": "Experiment with a new creative medium or project.",
    "journal": "What creative pursuits excite me, and how can I explore them further?",
    "tags": [
      "creativity",
      "artistic expression",
      "exploration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 131,
<<<<<<< Updated upstream
    "key": "Leo 12",
    "sign": "Leo",
    "degree": 12,
    "symbol": "Reset: A ownership and visibility moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize present.",
    "shadow": "Escaping replaces rest. Watch for approval-seeking.",
    "directive": "Pause and return with intent. Keep it ownership and visibility.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "focus",
      "reset",
      "present"
=======
    "key": "Leo12",
    "sign": "Leo",
    "degree": 12,
    "symbol": "A crown on a velvet pillow.",
    "signal": "Acknowledge your worth and leadership potential.",
    "shadow": "Doubt in your abilities can undermine your confidence.",
    "directive": "Recognize and embrace your leadership qualities.",
    "practice": "Take on a leadership role in a group or project.",
    "journal": "What qualities make me a strong leader, and how can I cultivate them?",
    "tags": [
      "leadership",
      "self-worth",
      "confidence"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 132,
    "key": "Leo 13",
    "sign": "Leo",
    "degree": 13,
<<<<<<< Updated upstream
    "symbol": "Commit: A ownership and visibility moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize present.",
    "shadow": "Half-commitment drains energy. Watch for approval-seeking.",
    "directive": "Commit fully. Keep it ownership and visibility.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "focus",
      "commit",
      "present"
=======
    "symbol": "A lion's mane flowing in the wind.",
    "signal": "Embrace your individuality and express your true self.",
    "shadow": "Fear of being vulnerable or misunderstood.",
    "directive": "Cultivate self-confidence by sharing your unique talents.",
    "practice": "Spend time each week showcasing a personal project or hobby.",
    "journal": "What aspects of myself do I hold back from expressing?",
    "tags": [
      "self-expression",
      "confidence",
      "creativity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 133,
    "key": "Leo 14",
    "sign": "Leo",
    "degree": 14,
<<<<<<< Updated upstream
    "symbol": "Boundaries: A ownership and visibility moment is on the table.",
    "signal": "Limits protect value. Emphasize present.",
    "shadow": "Saying yes too fast costs you. Watch for approval-seeking.",
    "directive": "Set a boundary. Keep it ownership and visibility.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "focus",
      "present"
=======
    "symbol": "A vibrant sunset casting colors across the sky.",
    "signal": "Recognize the beauty in transitions and endings.",
    "shadow": "Resistance to change and clinging to the past.",
    "directive": "Honor the cycles of life by letting go of what no longer serves you.",
    "practice": "Create a ritual to release old habits or beliefs.",
    "journal": "What do I need to let go of to embrace new beginnings?",
    "tags": [
      "transformation",
      "release",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 134,
    "key": "Leo 15",
    "sign": "Leo",
    "degree": 15,
<<<<<<< Updated upstream
    "symbol": "Mirror: A ownership and visibility moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize present.",
    "shadow": "Defensiveness blocks learning. Watch for approval-seeking.",
    "directive": "Take the note. Keep it ownership and visibility.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "focus",
      "present"
=======
    "symbol": "A stage illuminated by bright lights.",
    "signal": "Step into the spotlight and take center stage in your life.",
    "shadow": "Fear of judgment or feeling unworthy of attention.",
    "directive": "Seek opportunities to showcase your talents and leadership.",
    "practice": "Volunteer for a leadership role in a group or project.",
    "journal": "How do I feel about being in the spotlight?",
    "tags": [
      "leadership",
      "visibility",
      "self-worth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 135,
    "key": "Leo 16",
    "sign": "Leo",
    "degree": 16,
<<<<<<< Updated upstream
    "symbol": "Repair: A ownership and visibility moment is on the table.",
    "signal": "Something wants fixing. Emphasize present.",
    "shadow": "Avoidance compounds cost. Watch for approval-seeking.",
    "directive": "Repair it. Keep it ownership and visibility.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "focus",
      "present",
      "repair"
=======
    "symbol": "A proud peacock displaying its feathers.",
    "signal": "Celebrate your uniqueness and share it with the world.",
    "shadow": "Insecurity that leads to overcompensation or arrogance.",
    "directive": "Embrace your quirks and let them shine.",
    "practice": "Write down three things that make you unique and share them with someone.",
    "journal": "What makes me feel proud of who I am?",
    "tags": [
      "uniqueness",
      "celebration",
      "self-acceptance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 136,
    "key": "Leo 17",
    "sign": "Leo",
    "degree": 17,
<<<<<<< Updated upstream
    "symbol": "Focus: A ownership and visibility moment is on the table.",
    "signal": "Attention is currency. Emphasize present.",
    "shadow": "Multitasking reduces quality. Watch for approval-seeking.",
    "directive": "Single-task. Keep it ownership and visibility.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "present"
=======
    "symbol": "A grand parade celebrating community.",
    "signal": "Engage with your community and foster connections.",
    "shadow": "Isolation or feeling disconnected from others.",
    "directive": "Participate in local events to strengthen your bonds.",
    "practice": "Attend a community gathering or volunteer for a cause.",
    "journal": "How can I contribute to my community in a meaningful way?",
    "tags": [
      "community",
      "connection",
      "engagement"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 137,
    "key": "Leo 18",
    "sign": "Leo",
    "degree": 18,
<<<<<<< Updated upstream
    "symbol": "Standard: A ownership and visibility moment is on the table.",
    "signal": "Quality needs definition. Emphasize present.",
    "shadow": "Vague standards create stress. Watch for approval-seeking.",
    "directive": "Define the standard. Keep it ownership and visibility.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "focus",
      "present",
      "standard"
=======
    "symbol": "A roaring campfire surrounded by friends.",
    "signal": "Create a warm and inviting environment for others.",
    "shadow": "Neglecting your own needs while catering to others.",
    "directive": "Nurture relationships by being a source of support.",
    "practice": "Host a gathering to connect with friends and share stories.",
    "journal": "What do I need to feel more connected to those around me?",
    "tags": [
      "friendship",
      "support",
      "community"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 138,
    "key": "Leo 19",
    "sign": "Leo",
    "degree": 19,
<<<<<<< Updated upstream
    "symbol": "Tempo: A ownership and visibility moment is on the table.",
    "signal": "Timing matters. Emphasize present.",
    "shadow": "Forcing pace breaks form. Watch for approval-seeking.",
    "directive": "Set the pace. Keep it ownership and visibility.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "focus",
      "tempo",
      "present"
=======
    "symbol": "A skilled artist at work on a canvas.",
    "signal": "Harness your creativity and express your inner vision.",
    "shadow": "Self-doubt that hinders your creative flow.",
    "directive": "Dedicate time to explore your artistic passions.",
    "practice": "Engage in a creative activity that excites you, without judgment.",
    "journal": "What creative expression brings me joy?",
    "tags": [
      "creativity",
      "art",
      "self-expression"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 139,
    "key": "Leo 20",
    "sign": "Leo",
    "degree": 20,
<<<<<<< Updated upstream
    "symbol": "Risk: A ownership and visibility moment is on the table.",
    "signal": "A calculated step is required. Emphasize present.",
    "shadow": "Impulse risk is not courage. Watch for approval-seeking.",
    "directive": "Take a measured risk. Keep it ownership and visibility.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "present",
      "focus",
      "risk"
=======
    "symbol": "A majestic lion surveying its territory.",
    "signal": "Establish your boundaries and claim your space.",
    "shadow": "Fear of asserting yourself or being too aggressive.",
    "directive": "Stand firm in your beliefs and protect your values.",
    "practice": "Identify areas in your life where you need to set clearer boundaries.",
    "journal": "What boundaries do I need to reinforce in my life?",
    "tags": [
      "boundaries",
      "assertiveness",
      "self-respect"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 140,
    "key": "Leo 21",
    "sign": "Leo",
    "degree": 21,
<<<<<<< Updated upstream
    "symbol": "Integration: A ownership and visibility moment is on the table.",
    "signal": "Pieces want alignment. Emphasize present.",
    "shadow": "Fragmentation creates fatigue. Watch for approval-seeking.",
    "directive": "Integrate. Keep it ownership and visibility.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "focus",
      "present"
=======
    "symbol": "A crown resting on a velvet pillow.",
    "signal": "Acknowledge your inherent worth and leadership potential.",
    "shadow": "Doubting your authority or feeling unworthy of success.",
    "directive": "Embrace your leadership qualities and take charge.",
    "practice": "Identify a goal and create a plan to lead yourself toward it.",
    "journal": "In what areas of my life do I need to step up as a leader?",
    "tags": [
      "leadership",
      "self-worth",
      "empowerment"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 141,
    "key": "Leo 22",
    "sign": "Leo",
    "degree": 22,
<<<<<<< Updated upstream
    "symbol": "Authority: A ownership and visibility moment is on the table.",
    "signal": "Own responsibility. Emphasize present.",
    "shadow": "Blame delays progress. Watch for approval-seeking.",
    "directive": "Take ownership. Keep it ownership and visibility.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "focus",
      "authority",
      "present"
=======
    "symbol": "A vibrant garden in full bloom.",
    "signal": "Nurture your passions and allow them to flourish.",
    "shadow": "Neglecting your interests in favor of others' expectations.",
    "directive": "Invest time in activities that bring you joy and fulfillment.",
    "practice": "Create a list of hobbies and schedule time for them weekly.",
    "journal": "What passions have I neglected that I want to explore again?",
    "tags": [
      "passion",
      "nurturing",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 142,
    "key": "Leo 23",
    "sign": "Leo",
    "degree": 23,
<<<<<<< Updated upstream
    "symbol": "Refine: A ownership and visibility moment is on the table.",
    "signal": "Polish after completion. Emphasize present.",
    "shadow": "Editing before finishing stalls. Watch for approval-seeking.",
    "directive": "Refine the finished draft. Keep it ownership and visibility.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "focus",
      "present"
=======
    "symbol": "A bright star shining in the night sky.",
    "signal": "Illuminate your path and inspire others with your light.",
    "shadow": "Fear of being seen or shining too brightly.",
    "directive": "Share your insights and wisdom with those around you.",
    "practice": "Mentor someone or share your knowledge in a group setting.",
    "journal": "How can I inspire others through my experiences?",
    "tags": [
      "inspiration",
      "mentorship",
      "wisdom"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 143,
    "key": "Leo 24",
    "sign": "Leo",
    "degree": 24,
<<<<<<< Updated upstream
    "symbol": "Stewardship: A ownership and visibility moment is on the table.",
    "signal": "Resources need care. Emphasize present.",
    "shadow": "Waste hides in habits. Watch for approval-seeking.",
    "directive": "Protect resources. Keep it ownership and visibility.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "stewardship",
      "present"
=======
    "symbol": "A vibrant tapestry woven with diverse threads.",
    "signal": "Celebrate diversity and the richness it brings to your life.",
    "shadow": "Narrow-mindedness or exclusion of different perspectives.",
    "directive": "Engage with diverse communities and learn from them.",
    "practice": "Attend events that celebrate different cultures or viewpoints.",
    "journal": "What new perspectives can I embrace to enrich my life?",
    "tags": [
      "diversity",
      "inclusion",
      "learning"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 144,
    "key": "Leo 25",
    "sign": "Leo",
    "degree": 25,
<<<<<<< Updated upstream
    "symbol": "Signal-to-noise: A ownership and visibility moment is on the table.",
    "signal": "Simplify inputs. Emphasize present.",
    "shadow": "Overconsumption clouds judgment. Watch for approval-seeking.",
    "directive": "Reduce intake. Keep it ownership and visibility.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "focus",
      "present"
=======
    "symbol": "A bridge connecting two shores.",
    "signal": "The need to connect disparate ideas or people.",
    "shadow": "Fear of isolation or being misunderstood.",
    "directive": "Foster connections that bridge gaps in understanding.",
    "practice": "Reach out to someone with a different perspective and engage in a meaningful conversation.",
    "journal": "What bridges can I build in my life to connect with others more deeply?",
    "tags": [
      "connection",
      "communication",
      "understanding"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 145,
    "key": "Leo 26",
    "sign": "Leo",
    "degree": 26,
<<<<<<< Updated upstream
    "symbol": "Sustain: A ownership and visibility moment is on the table.",
    "signal": "Make it last. Emphasize present.",
    "shadow": "Burnout follows spikes. Watch for approval-seeking.",
    "directive": "Sustain. Keep it ownership and visibility.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "focus",
      "sustain",
      "present"
=======
    "symbol": "A lion tamer in the arena.",
    "signal": "The balance of power and control.",
    "shadow": "Struggle with authority or self-discipline.",
    "directive": "Embrace your inner strength while maintaining humility.",
    "practice": "Identify an area where you need to assert control and practice self-discipline.",
    "journal": "How can I assert my authority without overpowering others?",
    "tags": [
      "power",
      "control",
      "strength"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 146,
    "key": "Leo 27",
    "sign": "Leo",
    "degree": 27,
<<<<<<< Updated upstream
    "symbol": "Legacy: A ownership and visibility moment is on the table.",
    "signal": "Long-term view matters. Emphasize present.",
    "shadow": "Short-term ego derails. Watch for approval-seeking.",
    "directive": "Think long. Keep it ownership and visibility.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "legacy",
      "stewardship",
      "present"
=======
    "symbol": "A group of people gathered around a campfire.",
    "signal": "The warmth of community and shared experiences.",
    "shadow": "Fear of exclusion or loneliness.",
    "directive": "Engage with your community and share your experiences.",
    "practice": "Host a gathering or participate in a group activity to strengthen bonds.",
    "journal": "What role do I play in my community, and how can I contribute more?",
    "tags": [
      "community",
      "belonging",
      "sharing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 147,
    "key": "Leo 28",
    "sign": "Leo",
    "degree": 28,
<<<<<<< Updated upstream
    "symbol": "Closure: A ownership and visibility moment is on the table.",
    "signal": "Finish cycles. Emphasize present.",
    "shadow": "Open loops drain attention. Watch for approval-seeking.",
    "directive": "Close the loop. Keep it ownership and visibility.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "focus",
      "present"
=======
    "symbol": "A parade of people in colorful costumes.",
    "signal": "Celebration of individuality and creativity.",
    "shadow": "Fear of being judged or not being unique.",
    "directive": "Express your individuality and celebrate the differences in others.",
    "practice": "Create something that reflects your unique perspective, whether it's art, writing, or fashion.",
    "journal": "In what ways do I express my uniqueness, and how can I embrace it more fully?",
    "tags": [
      "creativity",
      "individuality",
      "celebration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 148,
    "key": "Leo 29",
    "sign": "Leo",
    "degree": 29,
<<<<<<< Updated upstream
    "symbol": "Threshold: A ownership and visibility moment is on the table.",
    "signal": "A transition is near. Emphasize present.",
    "shadow": "Hesitation creates drift. Watch for approval-seeking.",
    "directive": "Cross the threshold. Keep it ownership and visibility.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "focus",
      "present"
=======
    "symbol": "A child playing with a toy airplane.",
    "signal": "The joy of imagination and exploration.",
    "shadow": "Stagnation or loss of wonder.",
    "directive": "Reignite your sense of wonder and curiosity.",
    "practice": "Engage in a playful activity that allows you to explore new ideas or hobbies.",
    "journal": "What sparks my curiosity, and how can I incorporate more play into my life?",
    "tags": [
      "imagination",
      "exploration",
      "play"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 149,
    "key": "Leo 30",
    "sign": "Leo",
    "degree": 30,
<<<<<<< Updated upstream
    "symbol": "Completion: A ownership and visibility moment is on the table.",
    "signal": "Harvest the result. Emphasize present.",
    "shadow": "Skipping review repeats mistakes. Watch for approval-seeking.",
    "directive": "Complete and review. Keep it ownership and visibility.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "focus",
      "present",
      "completion"
=======
    "symbol": "A sunset over a vast landscape.",
    "signal": "The culmination of experiences and reflection.",
    "shadow": "Fear of endings or transitions.",
    "directive": "Reflect on your journey and acknowledge your growth.",
    "practice": "Spend time in nature, contemplating your achievements and lessons learned.",
    "journal": "What have I learned from my recent experiences, and how can I apply these lessons moving forward?",
    "tags": [
      "reflection",
      "growth",
      "transition"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 150,
    "key": "Virgo 1",
    "sign": "Virgo",
    "degree": 1,
<<<<<<< Updated upstream
    "symbol": "Start: A process and detail moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize refine.",
    "shadow": "Rushing creates rework. Watch for perfection delay.",
    "directive": "Start small and make it real. Keep it process and detail.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "refine",
      "start",
      "focus"
=======
    "symbol": "A woman organizing her home.",
    "signal": "The importance of order and clarity in daily life.",
    "shadow": "Overwhelm from chaos or disorganization.",
    "directive": "Create a structured environment that supports your goals.",
    "practice": "Dedicate time to declutter and organize a space in your home or workspace.",
    "journal": "How does my environment reflect my inner state, and what changes can I make for clarity?",
    "tags": [
      "organization",
      "clarity",
      "structure"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 151,
    "key": "Virgo 2",
    "sign": "Virgo",
    "degree": 2,
<<<<<<< Updated upstream
    "symbol": "Choice: A process and detail moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize refine.",
    "shadow": "Keeping both dilutes effort. Watch for perfection delay.",
    "directive": "Pick one lane and commit. Keep it process and detail.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "refine",
      "focus"
=======
    "symbol": "A gardener tending to her plants.",
    "signal": "Nurturing growth and development.",
    "shadow": "Neglecting self-care or personal growth.",
    "directive": "Invest time in nurturing your personal and professional growth.",
    "practice": "Set aside time for self-care activities that promote your well-being.",
    "journal": "What areas of my life need more nurturing, and how can I support that growth?",
    "tags": [
      "nurturing",
      "growth",
      "self-care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 152,
    "key": "Virgo 3",
    "sign": "Virgo",
    "degree": 3,
<<<<<<< Updated upstream
    "symbol": "Signal: A process and detail moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize refine.",
    "shadow": "Noise hides the point. Watch for perfection delay.",
    "directive": "Name the signal and ignore the rest. Keep it process and detail.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "refine",
      "focus",
      "signal"
=======
    "symbol": "A scientist conducting an experiment.",
    "signal": "The pursuit of knowledge and understanding.",
    "shadow": "Fear of failure or making mistakes.",
    "directive": "Embrace curiosity and the learning process.",
    "practice": "Engage in a new learning opportunity or experiment with a new skill.",
    "journal": "What knowledge do I seek, and how can I approach learning with an open mind?",
    "tags": [
      "knowledge",
      "learning",
      "curiosity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 153,
    "key": "Virgo 4",
    "sign": "Virgo",
    "degree": 4,
<<<<<<< Updated upstream
    "symbol": "Structure: A process and detail moment is on the table.",
    "signal": "A stable frame is needed. Emphasize refine.",
    "shadow": "Improvisation without a base collapses. Watch for perfection delay.",
    "directive": "Build the container first. Keep it process and detail.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "refine",
      "focus",
      "structure"
=======
    "symbol": "A busy marketplace.",
    "signal": "The dynamics of exchange and interaction.",
    "shadow": "Feeling overwhelmed by demands or competition.",
    "directive": "Balance your contributions with your needs in social interactions.",
    "practice": "Evaluate your interactions and ensure they are mutually beneficial.",
    "journal": "How do I balance giving and receiving in my relationships?",
    "tags": [
      "exchange",
      "interaction",
      "balance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 154,
    "key": "Virgo 5",
    "sign": "Virgo",
    "degree": 5,
<<<<<<< Updated upstream
    "symbol": "Craft: A process and detail moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize refine.",
    "shadow": "Overthinking delays practice. Watch for perfection delay.",
    "directive": "Practice the fundamentals. Keep it process and detail.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "refine",
      "focus"
=======
    "symbol": "A healer working with a patient.",
    "signal": "The importance of service and compassion.",
    "shadow": "Neglecting self-care while helping others.",
    "directive": "Practice compassion not only for others but also for yourself.",
    "practice": "Engage in an act of kindness, both for someone else and for yourself.",
    "journal": "How can I better care for myself while serving others?",
    "tags": [
      "service",
      "compassion",
      "healing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 155,
    "key": "Virgo 6",
    "sign": "Virgo",
    "degree": 6,
<<<<<<< Updated upstream
    "symbol": "Order: A process and detail moment is on the table.",
    "signal": "Details want sorting. Emphasize refine.",
    "shadow": "Perfectionism blocks delivery. Watch for perfection delay.",
    "directive": "Organize, then ship. Keep it process and detail.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "refine",
      "order",
=======
    "symbol": "A person analyzing data.",
    "signal": "The quest for clarity through analysis.",
    "shadow": "Getting lost in details or overthinking.",
    "directive": "Seek clarity through focused analysis without getting bogged down.",
    "practice": "Set a specific goal for analysis and limit distractions to maintain focus.",
    "journal": "What insights can I gain from my current situation through careful analysis?",
    "tags": [
      "analysis",
      "clarity",
>>>>>>> Stashed changes
      "focus"
    ]
  },
  {
    "idx": 156,
    "key": "Virgo 7",
    "sign": "Virgo",
    "degree": 7,
<<<<<<< Updated upstream
    "symbol": "Terms: A process and detail moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize refine.",
    "shadow": "Avoiding terms breeds friction. Watch for perfection delay.",
    "directive": "State expectations plainly. Keep it process and detail.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "refine",
      "terms",
      "focus"
=======
    "symbol": "A young woman holding a lighted lamp in a dark room.",
    "signal": "Illumination of inner wisdom amidst confusion.",
    "shadow": "Fear of the unknown leading to inaction.",
    "directive": "Seek clarity in your thoughts and emotions.",
    "practice": "Spend time in meditation or journaling to illuminate your inner thoughts.",
    "journal": "What fears are preventing me from seeking clarity?",
    "tags": [
      "illumination",
      "clarity",
      "meditation"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 157,
    "key": "Virgo 8",
    "sign": "Virgo",
    "degree": 8,
<<<<<<< Updated upstream
    "symbol": "Depth: A process and detail moment is on the table.",
    "signal": "A hidden factor matters. Emphasize refine.",
    "shadow": "Control replaces honesty. Watch for perfection delay.",
    "directive": "Confront the real issue. Keep it process and detail.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "refine",
      "depth",
      "focus"
=======
    "symbol": "A woman in a flowing dress dances gracefully.",
    "signal": "Embracing creativity and self-expression.",
    "shadow": "Stifling creativity due to self-doubt.",
    "directive": "Allow yourself to express your creativity freely.",
    "practice": "Engage in a creative activity without judgment.",
    "journal": "What creative expression have I been avoiding?",
    "tags": [
      "creativity",
      "self-expression",
      "dance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 158,
    "key": "Virgo 9",
    "sign": "Virgo",
    "degree": 9,
<<<<<<< Updated upstream
    "symbol": "Aim: A process and detail moment is on the table.",
    "signal": "A goal needs meaning. Emphasize refine.",
    "shadow": "Drift wastes time. Watch for perfection delay.",
    "directive": "Choose direction. Keep it process and detail.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "refine",
      "focus"
=======
    "symbol": "A group of people gathered around a table.",
    "signal": "Collaboration and community building.",
    "shadow": "Isolation due to fear of vulnerability.",
    "directive": "Reach out to your community for support and collaboration.",
    "practice": "Organize a gathering or meeting with friends or colleagues.",
    "journal": "How can I contribute to my community today?",
    "tags": [
      "community",
      "collaboration",
      "support"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 159,
    "key": "Virgo 10",
    "sign": "Virgo",
    "degree": 10,
<<<<<<< Updated upstream
    "symbol": "Ledger: A process and detail moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize refine.",
    "shadow": "Self-worth ties to output. Watch for perfection delay.",
    "directive": "Measure and adjust. Keep it process and detail.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "refine",
      "ledger",
      "stewardship"
=======
    "symbol": "A farmer tending to his crops.",
    "signal": "Nurturing growth and development.",
    "shadow": "Neglecting responsibilities due to overwhelm.",
    "directive": "Focus on nurturing your personal projects.",
    "practice": "Create a plan to tend to your goals daily.",
    "journal": "What area of my life needs more nurturing?",
    "tags": [
      "growth",
      "nurturing",
      "responsibility"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 160,
    "key": "Virgo 11",
    "sign": "Virgo",
    "degree": 11,
<<<<<<< Updated upstream
    "symbol": "Network: A process and detail moment is on the table.",
    "signal": "Support systems matter. Emphasize refine.",
    "shadow": "Isolation becomes a habit. Watch for perfection delay.",
    "directive": "Share the plan. Keep it process and detail.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "refine",
      "focus",
      "network"
=======
    "symbol": "A scientist conducting an experiment.",
    "signal": "Curiosity and the pursuit of knowledge.",
    "shadow": "Fear of failure preventing exploration.",
    "directive": "Embrace your curiosity and seek new knowledge.",
    "practice": "Take a class or read about a new topic of interest.",
    "journal": "What knowledge have I been curious about but hesitant to explore?",
    "tags": [
      "curiosity",
      "knowledge",
      "exploration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 161,
    "key": "Virgo 12",
    "sign": "Virgo",
    "degree": 12,
<<<<<<< Updated upstream
    "symbol": "Reset: A process and detail moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize refine.",
    "shadow": "Escaping replaces rest. Watch for perfection delay.",
    "directive": "Pause and return with intent. Keep it process and detail.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "refine",
      "focus",
      "reset"
=======
    "symbol": "An artist painting a mural.",
    "signal": "Transforming ideas into tangible creations.",
    "shadow": "Fear of judgment stifling creativity.",
    "directive": "Share your ideas and create something meaningful.",
    "practice": "Start a project that reflects your vision and values.",
    "journal": "What ideas have I been holding back from expressing?",
    "tags": [
      "art",
      "creation",
      "expression"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 162,
    "key": "Virgo 13",
    "sign": "Virgo",
    "degree": 13,
<<<<<<< Updated upstream
    "symbol": "Commit: A process and detail moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize refine.",
    "shadow": "Half-commitment drains energy. Watch for perfection delay.",
    "directive": "Commit fully. Keep it process and detail.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "refine",
      "commit",
      "focus"
=======
    "symbol": "A child playing with building blocks.",
    "signal": "Building foundations for future growth.",
    "shadow": "Overthinking preventing simple actions.",
    "directive": "Focus on the basics and build from there.",
    "practice": "Identify one small step you can take towards a larger goal.",
    "journal": "What foundational step can I take today?",
    "tags": [
      "foundations",
      "growth",
      "simplicity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 163,
    "key": "Virgo 14",
    "sign": "Virgo",
    "degree": 14,
<<<<<<< Updated upstream
    "symbol": "Boundaries: A process and detail moment is on the table.",
    "signal": "Limits protect value. Emphasize refine.",
    "shadow": "Saying yes too fast costs you. Watch for perfection delay.",
    "directive": "Set a boundary. Keep it process and detail.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "refine",
      "focus"
=======
    "symbol": "A person organizing their workspace.",
    "signal": "Creating order from chaos.",
    "shadow": "Procrastination leading to clutter.",
    "directive": "Declutter your physical and mental space.",
    "practice": "Spend time organizing a space that feels overwhelming.",
    "journal": "What clutter in my life is holding me back?",
    "tags": [
      "organization",
      "decluttering",
      "clarity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 164,
    "key": "Virgo 15",
    "sign": "Virgo",
    "degree": 15,
<<<<<<< Updated upstream
    "symbol": "Mirror: A process and detail moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize refine.",
    "shadow": "Defensiveness blocks learning. Watch for perfection delay.",
    "directive": "Take the note. Keep it process and detail.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "refine",
      "focus"
=======
    "symbol": "A healer tending to a patient.",
    "signal": "The importance of care and healing.",
    "shadow": "Neglecting self-care in the service of others.",
    "directive": "Prioritize your own well-being while helping others.",
    "practice": "Set aside time for self-care activities.",
    "journal": "How can I better balance my needs with those of others?",
    "tags": [
      "healing",
      "self-care",
      "balance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 165,
    "key": "Virgo 16",
    "sign": "Virgo",
    "degree": 16,
<<<<<<< Updated upstream
    "symbol": "Repair: A process and detail moment is on the table.",
    "signal": "Something wants fixing. Emphasize refine.",
    "shadow": "Avoidance compounds cost. Watch for perfection delay.",
    "directive": "Repair it. Keep it process and detail.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "refine",
      "focus",
      "repair"
=======
    "symbol": "A person reading a book in a library.",
    "signal": "Seeking knowledge and wisdom.",
    "shadow": "Avoiding introspection due to distractions.",
    "directive": "Dedicate time to learning and self-reflection.",
    "practice": "Read a book that challenges your perspective.",
    "journal": "What insights am I avoiding through distraction?",
    "tags": [
      "knowledge",
      "wisdom",
      "introspection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 166,
    "key": "Virgo 17",
    "sign": "Virgo",
    "degree": 17,
<<<<<<< Updated upstream
    "symbol": "Focus: A process and detail moment is on the table.",
    "signal": "Attention is currency. Emphasize refine.",
    "shadow": "Multitasking reduces quality. Watch for perfection delay.",
    "directive": "Single-task. Keep it process and detail.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "refine"
=======
    "symbol": "A gardener tending to a flower bed.",
    "signal": "Cultivating beauty and nurturing growth.",
    "shadow": "Neglecting personal beauty and self-care.",
    "directive": "Invest time in nurturing your personal beauty and well-being.",
    "practice": "Create a self-care ritual that brings you joy.",
    "journal": "What aspect of my personal beauty needs more attention?",
    "tags": [
      "beauty",
      "nurturing",
      "self-care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 167,
    "key": "Virgo 18",
    "sign": "Virgo",
    "degree": 18,
<<<<<<< Updated upstream
    "symbol": "Standard: A process and detail moment is on the table.",
    "signal": "Quality needs definition. Emphasize refine.",
    "shadow": "Vague standards create stress. Watch for perfection delay.",
    "directive": "Define the standard. Keep it process and detail.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "refine",
      "focus",
      "standard"
=======
    "symbol": "A person analyzing data on a computer.",
    "signal": "The power of analysis and critical thinking.",
    "shadow": "Over-analysis leading to paralysis.",
    "directive": "Use your analytical skills to make informed decisions.",
    "practice": "Break down a complex problem into manageable parts.",
    "journal": "What decision am I over-analyzing and how can I simplify it?",
    "tags": [
      "analysis",
      "decision-making",
      "critical thinking"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 168,
<<<<<<< Updated upstream
    "key": "Virgo 19",
    "sign": "Virgo",
    "degree": 19,
    "symbol": "Tempo: A process and detail moment is on the table.",
    "signal": "Timing matters. Emphasize refine.",
    "shadow": "Forcing pace breaks form. Watch for perfection delay.",
    "directive": "Set the pace. Keep it process and detail.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "refine",
      "tempo",
      "focus"
=======
    "key": "Virgo19",
    "sign": "Virgo",
    "degree": 19,
    "symbol": "A group of people are gathered to discuss a common goal.",
    "signal": "Collaboration and shared purpose.",
    "shadow": "Disorganization and lack of focus.",
    "directive": "Engage in teamwork to harness collective strengths.",
    "practice": "Organize a brainstorming session with peers to align on a project.",
    "journal": "What common goals can I pursue with others to enhance our outcomes?",
    "tags": [
      "collaboration",
      "teamwork",
      "goals"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 169,
<<<<<<< Updated upstream
    "key": "Virgo 20",
    "sign": "Virgo",
    "degree": 20,
    "symbol": "Risk: A process and detail moment is on the table.",
    "signal": "A calculated step is required. Emphasize refine.",
    "shadow": "Impulse risk is not courage. Watch for perfection delay.",
    "directive": "Take a measured risk. Keep it process and detail.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "refine",
      "focus",
      "risk"
=======
    "key": "Virgo20",
    "sign": "Virgo",
    "degree": 20,
    "symbol": "An artist creates a masterpiece in a serene environment.",
    "signal": "Creativity and tranquility.",
    "shadow": "Distraction and creative block.",
    "directive": "Cultivate a peaceful space for creative expression.",
    "practice": "Dedicate time to create something, free from interruptions.",
    "journal": "How can I create a more inspiring environment for my creativity?",
    "tags": [
      "creativity",
      "art",
      "environment"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 170,
<<<<<<< Updated upstream
    "key": "Virgo 21",
    "sign": "Virgo",
    "degree": 21,
    "symbol": "Integration: A process and detail moment is on the table.",
    "signal": "Pieces want alignment. Emphasize refine.",
    "shadow": "Fragmentation creates fatigue. Watch for perfection delay.",
    "directive": "Integrate. Keep it process and detail.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "refine",
      "focus"
=======
    "key": "Virgo21",
    "sign": "Virgo",
    "degree": 21,
    "symbol": "A farmer tending to his crops with care.",
    "signal": "Nurturing growth and patience.",
    "shadow": "Neglect and impatience.",
    "directive": "Invest time in nurturing your personal or professional projects.",
    "practice": "Create a schedule to regularly check in on your goals and progress.",
    "journal": "What areas of my life require more nurturing and attention?",
    "tags": [
      "growth",
      "nurturing",
      "patience"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 171,
<<<<<<< Updated upstream
    "key": "Virgo 22",
    "sign": "Virgo",
    "degree": 22,
    "symbol": "Authority: A process and detail moment is on the table.",
    "signal": "Own responsibility. Emphasize refine.",
    "shadow": "Blame delays progress. Watch for perfection delay.",
    "directive": "Take ownership. Keep it process and detail.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "refine",
      "authority",
      "focus"
=======
    "key": "Virgo22",
    "sign": "Virgo",
    "degree": 22,
    "symbol": "A skilled technician repairs a complex machine.",
    "signal": "Problem-solving and technical skills.",
    "shadow": "Frustration and avoidance of challenges.",
    "directive": "Embrace challenges as opportunities to enhance your skills.",
    "practice": "Tackle a technical problem head-on, seeking solutions actively.",
    "journal": "What technical skills can I improve to better handle challenges?",
    "tags": [
      "problem-solving",
      "skills",
      "technical"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 172,
<<<<<<< Updated upstream
    "key": "Virgo 23",
    "sign": "Virgo",
    "degree": 23,
    "symbol": "Refine: A process and detail moment is on the table.",
    "signal": "Polish after completion. Emphasize refine.",
    "shadow": "Editing before finishing stalls. Watch for perfection delay.",
    "directive": "Refine the finished draft. Keep it process and detail.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "focus"
=======
    "key": "Virgo23",
    "sign": "Virgo",
    "degree": 23,
    "symbol": "A healer tending to a patient with compassion.",
    "signal": "Empathy and healing.",
    "shadow": "Burnout and emotional detachment.",
    "directive": "Practice self-care while helping others.",
    "practice": "Set boundaries to ensure your own well-being while supporting others.",
    "journal": "How can I balance my desire to help others with my own needs?",
    "tags": [
      "healing",
      "empathy",
      "self-care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 173,
<<<<<<< Updated upstream
    "key": "Virgo 24",
    "sign": "Virgo",
    "degree": 24,
    "symbol": "Stewardship: A process and detail moment is on the table.",
    "signal": "Resources need care. Emphasize refine.",
    "shadow": "Waste hides in habits. Watch for perfection delay.",
    "directive": "Protect resources. Keep it process and detail.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "refine",
      "stewardship"
=======
    "key": "Virgo24",
    "sign": "Virgo",
    "degree": 24,
    "symbol": "A librarian organizes a vast collection of books.",
    "signal": "Order and knowledge management.",
    "shadow": "Chaos and information overload.",
    "directive": "Create systems to manage your information and resources effectively.",
    "practice": "Declutter your workspace or digital files to enhance clarity.",
    "journal": "What information or resources do I need to organize for better efficiency?",
    "tags": [
      "organization",
      "knowledge",
      "clarity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 174,
<<<<<<< Updated upstream
    "key": "Virgo 25",
    "sign": "Virgo",
    "degree": 25,
    "symbol": "Signal-to-noise: A process and detail moment is on the table.",
    "signal": "Simplify inputs. Emphasize refine.",
    "shadow": "Overconsumption clouds judgment. Watch for perfection delay.",
    "directive": "Reduce intake. Keep it process and detail.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "refine",
      "focus"
=======
    "key": "Virgo25",
    "sign": "Virgo",
    "degree": 25,
    "symbol": "A scientist conducts experiments in a lab.",
    "signal": "Inquiry and systematic exploration.",
    "shadow": "Rigidity and fear of failure.",
    "directive": "Approach problems with curiosity and an experimental mindset.",
    "practice": "Try a new method or technique in your work or personal life.",
    "journal": "What experiment can I conduct to explore new possibilities?",
    "tags": [
      "inquiry",
      "experimentation",
      "curiosity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 175,
<<<<<<< Updated upstream
    "key": "Virgo 26",
    "sign": "Virgo",
    "degree": 26,
    "symbol": "Sustain: A process and detail moment is on the table.",
    "signal": "Make it last. Emphasize refine.",
    "shadow": "Burnout follows spikes. Watch for perfection delay.",
    "directive": "Sustain. Keep it process and detail.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "refine",
      "sustain",
      "focus"
=======
    "key": "Virgo26",
    "sign": "Virgo",
    "degree": 26,
    "symbol": "A chef prepares a meal with fresh ingredients.",
    "signal": "Sustainability and nourishment.",
    "shadow": "Neglecting health and overindulgence.",
    "directive": "Focus on nourishing yourself and others with wholesome choices.",
    "practice": "Plan and prepare a healthy meal using fresh ingredients.",
    "journal": "How can I make healthier choices that nourish my body and mind?",
    "tags": [
      "nourishment",
      "health",
      "sustainability"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 176,
<<<<<<< Updated upstream
    "key": "Virgo 27",
    "sign": "Virgo",
    "degree": 27,
    "symbol": "Legacy: A process and detail moment is on the table.",
    "signal": "Long-term view matters. Emphasize refine.",
    "shadow": "Short-term ego derails. Watch for perfection delay.",
    "directive": "Think long. Keep it process and detail.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "refine",
      "legacy",
      "stewardship"
=======
    "key": "Virgo27",
    "sign": "Virgo",
    "degree": 27,
    "symbol": "A mentor guides a student in their learning.",
    "signal": "Teaching and guidance.",
    "shadow": "Overbearing control and lack of patience.",
    "directive": "Share your knowledge while allowing others to learn at their own pace.",
    "practice": "Offer mentorship or support to someone seeking guidance.",
    "journal": "What wisdom can I share that would benefit someone else?",
    "tags": [
      "mentorship",
      "teaching",
      "guidance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 177,
<<<<<<< Updated upstream
    "key": "Virgo 28",
    "sign": "Virgo",
    "degree": 28,
    "symbol": "Closure: A process and detail moment is on the table.",
    "signal": "Finish cycles. Emphasize refine.",
    "shadow": "Open loops drain attention. Watch for perfection delay.",
    "directive": "Close the loop. Keep it process and detail.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "refine",
      "focus"
=======
    "key": "Virgo28",
    "sign": "Virgo",
    "degree": 28,
    "symbol": "A gardener cultivates a diverse array of plants.",
    "signal": "Diversity and growth.",
    "shadow": "Stagnation and fear of change.",
    "directive": "Embrace diversity in your experiences and relationships.",
    "practice": "Explore new interests or connect with people from different backgrounds.",
    "journal": "What new perspectives can I welcome into my life for growth?",
    "tags": [
      "diversity",
      "growth",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 178,
<<<<<<< Updated upstream
    "key": "Virgo 29",
    "sign": "Virgo",
    "degree": 29,
    "symbol": "Threshold: A process and detail moment is on the table.",
    "signal": "A transition is near. Emphasize refine.",
    "shadow": "Hesitation creates drift. Watch for perfection delay.",
    "directive": "Cross the threshold. Keep it process and detail.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "refine",
      "focus"
=======
    "key": "Virgo29",
    "sign": "Virgo",
    "degree": 29,
    "symbol": "A community gathers to celebrate a festival.",
    "signal": "Connection and celebration.",
    "shadow": "Isolation and disconnection.",
    "directive": "Engage with your community to foster connections and joy.",
    "practice": "Participate in a local event or gathering to strengthen community ties.",
    "journal": "How can I contribute to my community's sense of connection and celebration?",
    "tags": [
      "community",
      "celebration",
      "connection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 179,
<<<<<<< Updated upstream
    "key": "Virgo 30",
    "sign": "Virgo",
    "degree": 30,
    "symbol": "Completion: A process and detail moment is on the table.",
    "signal": "Harvest the result. Emphasize refine.",
    "shadow": "Skipping review repeats mistakes. Watch for perfection delay.",
    "directive": "Complete and review. Keep it process and detail.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "refine",
      "focus",
      "completion"
=======
    "key": "Virgo30",
    "sign": "Virgo",
    "degree": 30,
    "symbol": "A person reflects on their life's journey.",
    "signal": "Self-reflection and understanding.",
    "shadow": "Avoidance of introspection and unresolved issues.",
    "directive": "Take time to reflect on your experiences and lessons learned.",
    "practice": "Journal about your journey and the insights you've gained.",
    "journal": "What lessons from my past can guide my future decisions?",
    "tags": [
      "self-reflection",
      "introspection",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 180,
<<<<<<< Updated upstream
    "key": "Libra 1",
    "sign": "Libra",
    "degree": 1,
    "symbol": "Start: A terms and balance moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize align.",
    "shadow": "Rushing creates rework. Watch for avoid conflict.",
    "directive": "Start small and make it real. Keep it terms and balance.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "focus",
      "align",
      "start"
=======
    "key": "Libra_1",
    "sign": "Libra",
    "degree": 1,
    "symbol": "A new partnership forms.",
    "signal": "Openness to collaboration.",
    "shadow": "Fear of losing individuality.",
    "directive": "Embrace teamwork and shared goals.",
    "practice": "Engage in a group project or discussion.",
    "journal": "What do I need to let go of to fully engage with others?",
    "tags": [
      "partnership",
      "collaboration",
      "teamwork"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 181,
<<<<<<< Updated upstream
    "key": "Libra 2",
    "sign": "Libra",
    "degree": 2,
    "symbol": "Choice: A terms and balance moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize align.",
    "shadow": "Keeping both dilutes effort. Watch for avoid conflict.",
    "directive": "Pick one lane and commit. Keep it terms and balance.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "focus",
      "align"
=======
    "key": "Libra_2",
    "sign": "Libra",
    "degree": 2,
    "symbol": "A scale balances.",
    "signal": "Seeking harmony and fairness.",
    "shadow": "Avoidance of conflict.",
    "directive": "Assess situations for fairness and equity.",
    "practice": "Practice active listening in conversations.",
    "journal": "Where am I compromising too much in my relationships?",
    "tags": [
      "balance",
      "fairness",
      "harmony"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 182,
<<<<<<< Updated upstream
    "key": "Libra 3",
    "sign": "Libra",
    "degree": 3,
    "symbol": "Signal: A terms and balance moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize align.",
    "shadow": "Noise hides the point. Watch for avoid conflict.",
    "directive": "Name the signal and ignore the rest. Keep it terms and balance.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "focus",
      "align",
      "signal"
=======
    "key": "Libra_3",
    "sign": "Libra",
    "degree": 3,
    "symbol": "A social gathering.",
    "signal": "Connection with community.",
    "shadow": "Feeling disconnected or isolated.",
    "directive": "Engage with your social circle.",
    "practice": "Host or attend a social event.",
    "journal": "How can I deepen my connections with others?",
    "tags": [
      "community",
      "social",
      "connection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 183,
<<<<<<< Updated upstream
    "key": "Libra 4",
    "sign": "Libra",
    "degree": 4,
    "symbol": "Structure: A terms and balance moment is on the table.",
    "signal": "A stable frame is needed. Emphasize align.",
    "shadow": "Improvisation without a base collapses. Watch for avoid conflict.",
    "directive": "Build the container first. Keep it terms and balance.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "focus",
      "align",
      "structure"
=======
    "key": "Libra_4",
    "sign": "Libra",
    "degree": 4,
    "symbol": "A beautiful artwork.",
    "signal": "Appreciation for aesthetics.",
    "shadow": "Neglecting inner beauty.",
    "directive": "Cultivate beauty in your surroundings.",
    "practice": "Create or curate something artistic.",
    "journal": "What beauty do I overlook in my life?",
    "tags": [
      "aesthetics",
      "art",
      "beauty"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 184,
<<<<<<< Updated upstream
    "key": "Libra 5",
    "sign": "Libra",
    "degree": 5,
    "symbol": "Craft: A terms and balance moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize align.",
    "shadow": "Overthinking delays practice. Watch for avoid conflict.",
    "directive": "Practice the fundamentals. Keep it terms and balance.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "focus",
      "align"
=======
    "key": "Libra_5",
    "sign": "Libra",
    "degree": 5,
    "symbol": "A negotiation table.",
    "signal": "The art of compromise.",
    "shadow": "Stubbornness in disagreements.",
    "directive": "Approach conflicts with a willingness to negotiate.",
    "practice": "Engage in a dialogue to resolve a disagreement.",
    "journal": "What am I willing to compromise on for a better outcome?",
    "tags": [
      "negotiation",
      "compromise",
      "conflict"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 185,
<<<<<<< Updated upstream
    "key": "Libra 6",
    "sign": "Libra",
    "degree": 6,
    "symbol": "Order: A terms and balance moment is on the table.",
    "signal": "Details want sorting. Emphasize align.",
    "shadow": "Perfectionism blocks delivery. Watch for avoid conflict.",
    "directive": "Organize, then ship. Keep it terms and balance.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "focus",
      "align",
      "order"
=======
    "key": "Libra_6",
    "sign": "Libra",
    "degree": 6,
    "symbol": "A couple in love.",
    "signal": "Romantic connections.",
    "shadow": "Fear of vulnerability.",
    "directive": "Nurture your romantic relationships.",
    "practice": "Plan a special date or moment with a partner.",
    "journal": "What fears hold me back from deeper intimacy?",
    "tags": [
      "romance",
      "love",
      "intimacy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 186,
<<<<<<< Updated upstream
    "key": "Libra 7",
    "sign": "Libra",
    "degree": 7,
    "symbol": "Terms: A terms and balance moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize align.",
    "shadow": "Avoiding terms breeds friction. Watch for avoid conflict.",
    "directive": "State expectations plainly. Keep it terms and balance.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "focus",
      "align",
      "terms"
=======
    "key": "Libra_7",
    "sign": "Libra",
    "degree": 7,
    "symbol": "A court of law.",
    "signal": "Justice and accountability.",
    "shadow": "Avoiding responsibility.",
    "directive": "Stand up for what is right.",
    "practice": "Reflect on your values and how they guide your actions.",
    "journal": "In what areas do I need to take more responsibility?",
    "tags": [
      "justice",
      "accountability",
      "responsibility"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 187,
<<<<<<< Updated upstream
    "key": "Libra 8",
    "sign": "Libra",
    "degree": 8,
    "symbol": "Depth: A terms and balance moment is on the table.",
    "signal": "A hidden factor matters. Emphasize align.",
    "shadow": "Control replaces honesty. Watch for avoid conflict.",
    "directive": "Confront the real issue. Keep it terms and balance.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "focus",
      "align",
      "depth"
=======
    "key": "Libra_8",
    "sign": "Libra",
    "degree": 8,
    "symbol": "A dance performance.",
    "signal": "Expression through movement.",
    "shadow": "Inhibition in self-expression.",
    "directive": "Express yourself creatively.",
    "practice": "Participate in a dance or movement class.",
    "journal": "What fears prevent me from expressing myself fully?",
    "tags": [
      "expression",
      "creativity",
      "movement"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 188,
<<<<<<< Updated upstream
    "key": "Libra 9",
    "sign": "Libra",
    "degree": 9,
    "symbol": "Aim: A terms and balance moment is on the table.",
    "signal": "A goal needs meaning. Emphasize align.",
    "shadow": "Drift wastes time. Watch for avoid conflict.",
    "directive": "Choose direction. Keep it terms and balance.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "align",
      "focus"
=======
    "key": "Libra_9",
    "sign": "Libra",
    "degree": 9,
    "symbol": "A garden in bloom.",
    "signal": "Growth and flourishing.",
    "shadow": "Neglecting personal growth.",
    "directive": "Invest time in personal development.",
    "practice": "Start a new learning project or hobby.",
    "journal": "What areas of my life need nurturing for growth?",
    "tags": [
      "growth",
      "development",
      "nurturing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 189,
<<<<<<< Updated upstream
    "key": "Libra 10",
    "sign": "Libra",
    "degree": 10,
    "symbol": "Ledger: A terms and balance moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize align.",
    "shadow": "Self-worth ties to output. Watch for avoid conflict.",
    "directive": "Measure and adjust. Keep it terms and balance.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "align",
      "ledger",
      "stewardship"
=======
    "key": "Libra_10",
    "sign": "Libra",
    "degree": 10,
    "symbol": "A family gathering.",
    "signal": "Supportive relationships.",
    "shadow": "Family conflicts or disconnection.",
    "directive": "Strengthen family ties.",
    "practice": "Reach out to a family member you haven't connected with.",
    "journal": "What unresolved issues do I need to address with my family?",
    "tags": [
      "family",
      "support",
      "relationships"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 190,
<<<<<<< Updated upstream
    "key": "Libra 11",
    "sign": "Libra",
    "degree": 11,
    "symbol": "Network: A terms and balance moment is on the table.",
    "signal": "Support systems matter. Emphasize align.",
    "shadow": "Isolation becomes a habit. Watch for avoid conflict.",
    "directive": "Share the plan. Keep it terms and balance.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "focus",
      "align",
      "network"
=======
    "key": "Libra_11",
    "sign": "Libra",
    "degree": 11,
    "symbol": "A bridge spanning a river.",
    "signal": "Connecting different perspectives.",
    "shadow": "Resistance to change.",
    "directive": "Build bridges in your relationships.",
    "practice": "Engage in a conversation with someone who has a different viewpoint.",
    "journal": "How can I better understand opposing perspectives?",
    "tags": [
      "connection",
      "perspective",
      "understanding"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 191,
<<<<<<< Updated upstream
    "key": "Libra 12",
    "sign": "Libra",
    "degree": 12,
    "symbol": "Reset: A terms and balance moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize align.",
    "shadow": "Escaping replaces rest. Watch for avoid conflict.",
    "directive": "Pause and return with intent. Keep it terms and balance.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "focus",
      "align",
      "reset"
=======
    "key": "Libra_12",
    "sign": "Libra",
    "degree": 12,
    "symbol": "A wise elder.",
    "signal": "Guidance and wisdom.",
    "shadow": "Ignoring valuable advice.",
    "directive": "Seek wisdom from those with experience.",
    "practice": "Consult a mentor or someone you admire for guidance.",
    "journal": "What lessons can I learn from my past experiences?",
    "tags": [
      "wisdom",
      "guidance",
      "mentorship"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 192,
<<<<<<< Updated upstream
    "key": "Libra 13",
    "sign": "Libra",
    "degree": 13,
    "symbol": "Commit: A terms and balance moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize align.",
    "shadow": "Half-commitment drains energy. Watch for avoid conflict.",
    "directive": "Commit fully. Keep it terms and balance.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "focus",
      "align",
      "commit"
=======
    "key": "Libra_13",
    "sign": "Libra",
    "degree": 13,
    "symbol": "A group of people gathered for a common purpose.",
    "signal": "Collaboration and teamwork are essential.",
    "shadow": "Avoiding conflict may lead to stagnation.",
    "directive": "Engage with others to achieve shared goals.",
    "practice": "Join a community project or group activity.",
    "journal": "What common purpose can I pursue with others?",
    "tags": [
      "collaboration",
      "community",
      "teamwork"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 193,
<<<<<<< Updated upstream
    "key": "Libra 14",
    "sign": "Libra",
    "degree": 14,
    "symbol": "Boundaries: A terms and balance moment is on the table.",
    "signal": "Limits protect value. Emphasize align.",
    "shadow": "Saying yes too fast costs you. Watch for avoid conflict.",
    "directive": "Set a boundary. Keep it terms and balance.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "focus",
      "align"
=======
    "key": "Libra_14",
    "sign": "Libra",
    "degree": 14,
    "symbol": "A well-dressed individual in a social setting.",
    "signal": "Presentation and social skills matter.",
    "shadow": "Overemphasis on appearance can lead to superficiality.",
    "directive": "Cultivate genuine connections beyond appearances.",
    "practice": "Attend a networking event and engage authentically.",
    "journal": "How can I express my true self in social situations?",
    "tags": [
      "social skills",
      "authenticity",
      "networking"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 194,
<<<<<<< Updated upstream
    "key": "Libra 15",
    "sign": "Libra",
    "degree": 15,
    "symbol": "Mirror: A terms and balance moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize align.",
    "shadow": "Defensiveness blocks learning. Watch for avoid conflict.",
    "directive": "Take the note. Keep it terms and balance.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "align",
      "focus"
=======
    "key": "Libra_15",
    "sign": "Libra",
    "degree": 15,
    "symbol": "A pair of scales balancing.",
    "signal": "Seek harmony and balance in relationships.",
    "shadow": "Neglecting personal needs for others' sake can create resentment.",
    "directive": "Assess where balance is lacking in your life.",
    "practice": "Make a list of your needs and those of others.",
    "journal": "In what areas do I need to restore balance?",
    "tags": [
      "balance",
      "relationships",
      "harmony"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 195,
<<<<<<< Updated upstream
    "key": "Libra 16",
    "sign": "Libra",
    "degree": 16,
    "symbol": "Repair: A terms and balance moment is on the table.",
    "signal": "Something wants fixing. Emphasize align.",
    "shadow": "Avoidance compounds cost. Watch for avoid conflict.",
    "directive": "Repair it. Keep it terms and balance.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "focus",
      "align",
      "repair"
=======
    "key": "Libra_16",
    "sign": "Libra",
    "degree": 16,
    "symbol": "An artist creating a masterpiece.",
    "signal": "Creativity can enhance relationships.",
    "shadow": "Fear of judgment may stifle self-expression.",
    "directive": "Explore creative outlets that involve collaboration.",
    "practice": "Join a class or workshop to express your creativity.",
    "journal": "What creative project can I start with others?",
    "tags": [
      "creativity",
      "collaboration",
      "self-expression"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 196,
<<<<<<< Updated upstream
    "key": "Libra 17",
    "sign": "Libra",
    "degree": 17,
    "symbol": "Focus: A terms and balance moment is on the table.",
    "signal": "Attention is currency. Emphasize align.",
    "shadow": "Multitasking reduces quality. Watch for avoid conflict.",
    "directive": "Single-task. Keep it terms and balance.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "align"
=======
    "key": "Libra_17",
    "sign": "Libra",
    "degree": 17,
    "symbol": "A couple dancing gracefully.",
    "signal": "Embrace the rhythm of partnership.",
    "shadow": "Rigid roles can disrupt harmony.",
    "directive": "Communicate openly to find your dance together.",
    "practice": "Try a dance class or partner exercise.",
    "journal": "How can I improve the flow in my relationships?",
    "tags": [
      "partnership",
      "communication",
      "harmony"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 197,
<<<<<<< Updated upstream
    "key": "Libra 18",
    "sign": "Libra",
    "degree": 18,
    "symbol": "Standard: A terms and balance moment is on the table.",
    "signal": "Quality needs definition. Emphasize align.",
    "shadow": "Vague standards create stress. Watch for avoid conflict.",
    "directive": "Define the standard. Keep it terms and balance.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "focus",
      "align",
      "standard"
=======
    "key": "Libra_18",
    "sign": "Libra",
    "degree": 18,
    "symbol": "A serene landscape reflecting peace.",
    "signal": "Inner peace fosters better connections.",
    "shadow": "Ignoring inner turmoil can affect relationships.",
    "directive": "Create a peaceful environment for reflection.",
    "practice": "Spend time in nature or practice mindfulness.",
    "journal": "What inner conflicts do I need to address for peace?",
    "tags": [
      "inner peace",
      "reflection",
      "mindfulness"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 198,
<<<<<<< Updated upstream
    "key": "Libra 19",
    "sign": "Libra",
    "degree": 19,
    "symbol": "Tempo: A terms and balance moment is on the table.",
    "signal": "Timing matters. Emphasize align.",
    "shadow": "Forcing pace breaks form. Watch for avoid conflict.",
    "directive": "Set the pace. Keep it terms and balance.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "focus",
      "align",
      "tempo"
=======
    "key": "Libra_19",
    "sign": "Libra",
    "degree": 19,
    "symbol": "A judge in a courtroom.",
    "signal": "Fairness and justice are crucial in interactions.",
    "shadow": "Judgment without understanding can harm relationships.",
    "directive": "Practice empathy and active listening.",
    "practice": "Engage in discussions that require understanding diverse perspectives.",
    "journal": "How can I be more fair and just in my dealings with others?",
    "tags": [
      "fairness",
      "justice",
      "empathy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 199,
<<<<<<< Updated upstream
    "key": "Libra 20",
    "sign": "Libra",
    "degree": 20,
    "symbol": "Risk: A terms and balance moment is on the table.",
    "signal": "A calculated step is required. Emphasize align.",
    "shadow": "Impulse risk is not courage. Watch for avoid conflict.",
    "directive": "Take a measured risk. Keep it terms and balance.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "focus",
      "align",
      "risk"
=======
    "key": "Libra_20",
    "sign": "Libra",
    "degree": 20,
    "symbol": "A bridge connecting two sides.",
    "signal": "Building connections is vital for growth.",
    "shadow": "Isolation can hinder progress.",
    "directive": "Reach out to someone you’ve lost touch with.",
    "practice": "Initiate a conversation with an old friend or colleague.",
    "journal": "Who can I reconnect with to strengthen my network?",
    "tags": [
      "connections",
      "networking",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 200,
<<<<<<< Updated upstream
    "key": "Libra 21",
    "sign": "Libra",
    "degree": 21,
    "symbol": "Integration: A terms and balance moment is on the table.",
    "signal": "Pieces want alignment. Emphasize align.",
    "shadow": "Fragmentation creates fatigue. Watch for avoid conflict.",
    "directive": "Integrate. Keep it terms and balance.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "focus",
      "align"
=======
    "key": "Libra_21",
    "sign": "Libra",
    "degree": 21,
    "symbol": "A diplomat negotiating peace.",
    "signal": "Conflict resolution skills are essential.",
    "shadow": "Avoiding conflict can lead to unresolved issues.",
    "directive": "Practice negotiation and compromise in disputes.",
    "practice": "Role-play a negotiation scenario to enhance skills.",
    "journal": "What conflict in my life needs resolution?",
    "tags": [
      "conflict resolution",
      "negotiation",
      "diplomacy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 201,
<<<<<<< Updated upstream
    "key": "Libra 22",
    "sign": "Libra",
    "degree": 22,
    "symbol": "Authority: A terms and balance moment is on the table.",
    "signal": "Own responsibility. Emphasize align.",
    "shadow": "Blame delays progress. Watch for avoid conflict.",
    "directive": "Take ownership. Keep it terms and balance.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "focus",
      "authority",
      "align"
=======
    "key": "Libra_22",
    "sign": "Libra",
    "degree": 22,
    "symbol": "A gathering of diverse individuals.",
    "signal": "Diversity enriches relationships and perspectives.",
    "shadow": "Homogeneity can limit growth and understanding.",
    "directive": "Seek out diverse viewpoints and experiences.",
    "practice": "Attend an event celebrating cultural diversity.",
    "journal": "How can I embrace diversity in my relationships?",
    "tags": [
      "diversity",
      "perspectives",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 202,
<<<<<<< Updated upstream
    "key": "Libra 23",
    "sign": "Libra",
    "degree": 23,
    "symbol": "Refine: A terms and balance moment is on the table.",
    "signal": "Polish after completion. Emphasize align.",
    "shadow": "Editing before finishing stalls. Watch for avoid conflict.",
    "directive": "Refine the finished draft. Keep it terms and balance.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "align",
      "focus"
=======
    "key": "Libra_23",
    "sign": "Libra",
    "degree": 23,
    "symbol": "A garden blooming with various flowers.",
    "signal": "Nurturing relationships leads to growth.",
    "shadow": "Neglecting connections can lead to decay.",
    "directive": "Invest time and energy into your relationships.",
    "practice": "Plan a gathering to strengthen bonds with loved ones.",
    "journal": "What relationships need more nurturing in my life?",
    "tags": [
      "nurturing",
      "relationships",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 203,
<<<<<<< Updated upstream
    "key": "Libra 24",
    "sign": "Libra",
    "degree": 24,
    "symbol": "Stewardship: A terms and balance moment is on the table.",
    "signal": "Resources need care. Emphasize align.",
    "shadow": "Waste hides in habits. Watch for avoid conflict.",
    "directive": "Protect resources. Keep it terms and balance.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "align",
      "stewardship"
=======
    "key": "Libra_24",
    "sign": "Libra",
    "degree": 24,
    "symbol": "A lighthouse guiding ships.",
    "signal": "Be a guiding light for others in your community.",
    "shadow": "Neglecting your role can leave others adrift.",
    "directive": "Share your knowledge and experiences with others.",
    "practice": "Volunteer or mentor someone in need.",
    "journal": "How can I be a guiding light for someone today?",
    "tags": [
      "guidance",
      "community",
      "mentorship"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 204,
    "key": "Libra 25",
    "sign": "Libra",
    "degree": 25,
<<<<<<< Updated upstream
    "symbol": "Signal-to-noise: A terms and balance moment is on the table.",
    "signal": "Simplify inputs. Emphasize align.",
    "shadow": "Overconsumption clouds judgment. Watch for avoid conflict.",
    "directive": "Reduce intake. Keep it terms and balance.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "focus",
      "align"
=======
    "symbol": "A group of people gathered around a table.",
    "signal": "Collaboration and shared goals.",
    "shadow": "Conflict arising from differing perspectives.",
    "directive": "Focus on active listening and compromise in group settings.",
    "practice": "Engage in a team project where everyone's input is valued.",
    "journal": "How do I navigate differing opinions in collaborative environments?",
    "tags": [
      "collaboration",
      "teamwork",
      "communication"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 205,
    "key": "Libra 26",
    "sign": "Libra",
    "degree": 26,
<<<<<<< Updated upstream
    "symbol": "Sustain: A terms and balance moment is on the table.",
    "signal": "Make it last. Emphasize align.",
    "shadow": "Burnout follows spikes. Watch for avoid conflict.",
    "directive": "Sustain. Keep it terms and balance.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "focus",
      "sustain",
      "align"
=======
    "symbol": "A woman holding a balance scale.",
    "signal": "The pursuit of fairness and justice.",
    "shadow": "Indecision due to over-analysis.",
    "directive": "Assess situations objectively before making decisions.",
    "practice": "Write down pros and cons for a current dilemma.",
    "journal": "What biases might be influencing my sense of fairness?",
    "tags": [
      "justice",
      "decision-making",
      "balance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 206,
    "key": "Libra 27",
    "sign": "Libra",
    "degree": 27,
<<<<<<< Updated upstream
    "symbol": "Legacy: A terms and balance moment is on the table.",
    "signal": "Long-term view matters. Emphasize align.",
    "shadow": "Short-term ego derails. Watch for avoid conflict.",
    "directive": "Think long. Keep it terms and balance.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "align",
      "legacy",
      "stewardship"
=======
    "symbol": "A couple dancing gracefully.",
    "signal": "Harmony in relationships.",
    "shadow": "Avoidance of conflict leading to unresolved issues.",
    "directive": "Cultivate open communication with loved ones.",
    "practice": "Plan a date night focused on sharing feelings and thoughts.",
    "journal": "What unspoken issues exist in my closest relationships?",
    "tags": [
      "relationships",
      "communication",
      "harmony"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 207,
    "key": "Libra 28",
    "sign": "Libra",
    "degree": 28,
<<<<<<< Updated upstream
    "symbol": "Closure: A terms and balance moment is on the table.",
    "signal": "Finish cycles. Emphasize align.",
    "shadow": "Open loops drain attention. Watch for avoid conflict.",
    "directive": "Close the loop. Keep it terms and balance.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "align",
      "focus"
=======
    "symbol": "A bridge connecting two shores.",
    "signal": "Building connections and understanding.",
    "shadow": "Fear of vulnerability in sharing oneself.",
    "directive": "Reach out to someone to strengthen a connection.",
    "practice": "Initiate a meaningful conversation with a friend or family member.",
    "journal": "What fears hold me back from deeper connections?",
    "tags": [
      "connection",
      "understanding",
      "vulnerability"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 208,
    "key": "Libra 29",
    "sign": "Libra",
    "degree": 29,
<<<<<<< Updated upstream
    "symbol": "Threshold: A terms and balance moment is on the table.",
    "signal": "A transition is near. Emphasize align.",
    "shadow": "Hesitation creates drift. Watch for avoid conflict.",
    "directive": "Cross the threshold. Keep it terms and balance.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "focus",
      "align"
=======
    "symbol": "A person standing at a crossroads.",
    "signal": "Choices that shape one's path.",
    "shadow": "Stagnation from fear of making the wrong choice.",
    "directive": "Evaluate your options and trust your intuition.",
    "practice": "Create a vision board to clarify your goals and desires.",
    "journal": "What choices am I avoiding, and why?",
    "tags": [
      "choices",
      "introspection",
      "path"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 209,
    "key": "Libra 30",
    "sign": "Libra",
    "degree": 30,
<<<<<<< Updated upstream
    "symbol": "Completion: A terms and balance moment is on the table.",
    "signal": "Harvest the result. Emphasize align.",
    "shadow": "Skipping review repeats mistakes. Watch for avoid conflict.",
    "directive": "Complete and review. Keep it terms and balance.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "focus",
      "align",
      "completion"
=======
    "symbol": "A sunset over a calm sea.",
    "signal": "The beauty of closure and new beginnings.",
    "shadow": "Resistance to letting go of the past.",
    "directive": "Embrace endings as opportunities for growth.",
    "practice": "Write a letter of closure to a past situation or relationship.",
    "journal": "What past experiences do I need to release to move forward?",
    "tags": [
      "closure",
      "new beginnings",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 210,
    "key": "Scorpio 1",
    "sign": "Scorpio",
    "degree": 1,
<<<<<<< Updated upstream
    "symbol": "Start: A truth and depth moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize simplify.",
    "shadow": "Rushing creates rework. Watch for control games.",
    "directive": "Start small and make it real. Keep it truth and depth.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "simplify",
      "start",
      "focus"
=======
    "symbol": "A phoenix rising from the ashes.",
    "signal": "Transformation and renewal.",
    "shadow": "Fear of change and the unknown.",
    "directive": "Embrace change as a necessary part of life.",
    "practice": "Identify an area in your life that needs transformation and take one step towards it.",
    "journal": "What transformations am I resisting and why?",
    "tags": [
      "transformation",
      "renewal",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 211,
    "key": "Scorpio 2",
    "sign": "Scorpio",
    "degree": 2,
<<<<<<< Updated upstream
    "symbol": "Choice: A truth and depth moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize simplify.",
    "shadow": "Keeping both dilutes effort. Watch for control games.",
    "directive": "Pick one lane and commit. Keep it truth and depth.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "simplify",
      "focus"
=======
    "symbol": "A deep well of water.",
    "signal": "Exploration of inner depths and emotions.",
    "shadow": "Avoidance of confronting deep-seated feelings.",
    "directive": "Dive into your emotions and understand their roots.",
    "practice": "Spend time in reflection or meditation to explore your feelings.",
    "journal": "What emotions am I avoiding, and what do they reveal?",
    "tags": [
      "emotions",
      "introspection",
      "depth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 212,
    "key": "Scorpio 3",
    "sign": "Scorpio",
    "degree": 3,
<<<<<<< Updated upstream
    "symbol": "Signal: A truth and depth moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize simplify.",
    "shadow": "Noise hides the point. Watch for control games.",
    "directive": "Name the signal and ignore the rest. Keep it truth and depth.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "simplify",
      "focus",
      "signal"
=======
    "symbol": "A snake shedding its skin.",
    "signal": "The process of letting go and renewal.",
    "shadow": "Clinging to outdated beliefs or identities.",
    "directive": "Identify what no longer serves you and release it.",
    "practice": "Create a ritual to symbolize letting go of the old and welcoming the new.",
    "journal": "What beliefs or habits do I need to shed for my growth?",
    "tags": [
      "letting go",
      "renewal",
      "transformation"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 213,
    "key": "Scorpio 4",
    "sign": "Scorpio",
    "degree": 4,
<<<<<<< Updated upstream
    "symbol": "Structure: A truth and depth moment is on the table.",
    "signal": "A stable frame is needed. Emphasize simplify.",
    "shadow": "Improvisation without a base collapses. Watch for control games.",
    "directive": "Build the container first. Keep it truth and depth.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "simplify",
      "focus",
      "structure"
=======
    "symbol": "A locked door.",
    "signal": "Hidden aspects of self or situations.",
    "shadow": "Fear of confronting what lies behind the door.",
    "directive": "Explore your fears and unlock hidden potentials.",
    "practice": "Journal about what you fear and how it limits you.",
    "journal": "What hidden aspects of myself am I ready to confront?",
    "tags": [
      "self-discovery",
      "fear",
      "hidden"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 214,
    "key": "Scorpio 5",
    "sign": "Scorpio",
    "degree": 5,
<<<<<<< Updated upstream
    "symbol": "Craft: A truth and depth moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize simplify.",
    "shadow": "Overthinking delays practice. Watch for control games.",
    "directive": "Practice the fundamentals. Keep it truth and depth.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "simplify",
      "focus"
=======
    "symbol": "A spider weaving its web.",
    "signal": "Creation and the interconnectedness of life.",
    "shadow": "Feeling trapped by one's own creations.",
    "directive": "Recognize the power of your choices and their consequences.",
    "practice": "Reflect on how your actions impact your life and others.",
    "journal": "What webs have I woven that I need to untangle?",
    "tags": [
      "creation",
      "interconnectedness",
      "consequences"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 215,
    "key": "Scorpio 6",
    "sign": "Scorpio",
    "degree": 6,
<<<<<<< Updated upstream
    "symbol": "Order: A truth and depth moment is on the table.",
    "signal": "Details want sorting. Emphasize simplify.",
    "shadow": "Perfectionism blocks delivery. Watch for control games.",
    "directive": "Organize, then ship. Keep it truth and depth.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "simplify",
      "order",
      "focus"
=======
    "symbol": "A candle flickering in the dark.",
    "signal": "Hope and guidance in difficult times.",
    "shadow": "Despair and loss of direction.",
    "directive": "Seek out sources of light and inspiration in your life.",
    "practice": "Identify and connect with a mentor or role model.",
    "journal": "What sources of hope can I cultivate in my life?",
    "tags": [
      "hope",
      "guidance",
      "inspiration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 216,
<<<<<<< Updated upstream
    "key": "Scorpio 7",
    "sign": "Scorpio",
    "degree": 7,
    "symbol": "Terms: A truth and depth moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize simplify.",
    "shadow": "Avoiding terms breeds friction. Watch for control games.",
    "directive": "State expectations plainly. Keep it truth and depth.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "simplify",
      "terms",
      "focus"
=======
    "key": "Scorpio_7",
    "sign": "Scorpio",
    "degree": 7,
    "symbol": "A deep well reflects the sky above.",
    "signal": "Embrace introspection and the depths of your emotions.",
    "shadow": "Fear of vulnerability and emotional isolation.",
    "directive": "Engage in self-reflection to uncover hidden truths.",
    "practice": "Spend time journaling about your feelings and experiences.",
    "journal": "What emotions have I been avoiding, and why?",
    "tags": [
      "introspection",
      "emotions",
      "self-reflection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 217,
<<<<<<< Updated upstream
    "key": "Scorpio 8",
    "sign": "Scorpio",
    "degree": 8,
    "symbol": "Depth: A truth and depth moment is on the table.",
    "signal": "A hidden factor matters. Emphasize simplify.",
    "shadow": "Control replaces honesty. Watch for control games.",
    "directive": "Confront the real issue. Keep it truth and depth.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "simplify",
      "depth",
      "focus"
=======
    "key": "Scorpio_8",
    "sign": "Scorpio",
    "degree": 8,
    "symbol": "A phoenix rises from the ashes.",
    "signal": "Transformation and renewal are possible.",
    "shadow": "Resistance to change and clinging to the past.",
    "directive": "Allow yourself to let go of what no longer serves you.",
    "practice": "Create a ritual to symbolize release and renewal.",
    "journal": "What old patterns am I ready to release?",
    "tags": [
      "transformation",
      "renewal",
      "letting go"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 218,
<<<<<<< Updated upstream
    "key": "Scorpio 9",
    "sign": "Scorpio",
    "degree": 9,
    "symbol": "Aim: A truth and depth moment is on the table.",
    "signal": "A goal needs meaning. Emphasize simplify.",
    "shadow": "Drift wastes time. Watch for control games.",
    "directive": "Choose direction. Keep it truth and depth.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "simplify",
      "focus"
=======
    "key": "Scorpio_9",
    "sign": "Scorpio",
    "degree": 9,
    "symbol": "A serpent sheds its skin.",
    "signal": "Embrace the cycles of growth and renewal.",
    "shadow": "Fear of vulnerability in the face of change.",
    "directive": "Recognize the necessity of change for personal growth.",
    "practice": "Identify areas in your life where you need to evolve.",
    "journal": "What aspects of my life require a fresh start?",
    "tags": [
      "growth",
      "evolution",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 219,
<<<<<<< Updated upstream
    "key": "Scorpio 10",
    "sign": "Scorpio",
    "degree": 10,
    "symbol": "Ledger: A truth and depth moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize simplify.",
    "shadow": "Self-worth ties to output. Watch for control games.",
    "directive": "Measure and adjust. Keep it truth and depth.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "simplify",
      "ledger",
      "stewardship"
=======
    "key": "Scorpio_10",
    "sign": "Scorpio",
    "degree": 10,
    "symbol": "A hidden treasure is discovered.",
    "signal": "Uncovering hidden talents and resources.",
    "shadow": "Neglecting your own potential and worth.",
    "directive": "Explore and acknowledge your unique skills and gifts.",
    "practice": "Take a strengths assessment or seek feedback from others.",
    "journal": "What hidden talents have I yet to recognize?",
    "tags": [
      "self-discovery",
      "potential",
      "talents"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 220,
<<<<<<< Updated upstream
    "key": "Scorpio 11",
    "sign": "Scorpio",
    "degree": 11,
    "symbol": "Network: A truth and depth moment is on the table.",
    "signal": "Support systems matter. Emphasize simplify.",
    "shadow": "Isolation becomes a habit. Watch for control games.",
    "directive": "Share the plan. Keep it truth and depth.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "simplify",
      "focus",
      "network"
=======
    "key": "Scorpio_11",
    "sign": "Scorpio",
    "degree": 11,
    "symbol": "A storm brews on the horizon.",
    "signal": "Anticipate challenges and prepare for change.",
    "shadow": "Avoidance of conflict and emotional turbulence.",
    "directive": "Face potential conflicts head-on with courage.",
    "practice": "Develop a plan for addressing upcoming challenges.",
    "journal": "What challenges am I avoiding, and how can I confront them?",
    "tags": [
      "conflict",
      "preparation",
      "courage"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 221,
<<<<<<< Updated upstream
    "key": "Scorpio 12",
    "sign": "Scorpio",
    "degree": 12,
    "symbol": "Reset: A truth and depth moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize simplify.",
    "shadow": "Escaping replaces rest. Watch for control games.",
    "directive": "Pause and return with intent. Keep it truth and depth.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "simplify",
      "focus",
      "reset"
=======
    "key": "Scorpio_12",
    "sign": "Scorpio",
    "degree": 12,
    "symbol": "A candle flickers in the dark.",
    "signal": "Hope and guidance in difficult times.",
    "shadow": "Despair and feeling lost in darkness.",
    "directive": "Seek out sources of inspiration and support.",
    "practice": "Light a candle during meditation to symbolize hope.",
    "journal": "What brings light into my life during dark times?",
    "tags": [
      "hope",
      "support",
      "inspiration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 222,
<<<<<<< Updated upstream
    "key": "Scorpio 13",
    "sign": "Scorpio",
    "degree": 13,
    "symbol": "Commit: A truth and depth moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize simplify.",
    "shadow": "Half-commitment drains energy. Watch for control games.",
    "directive": "Commit fully. Keep it truth and depth.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "simplify",
      "commit",
      "focus"
=======
    "key": "Scorpio_13",
    "sign": "Scorpio",
    "degree": 13,
    "symbol": "An ancient tree stands tall.",
    "signal": "Strength and resilience through time.",
    "shadow": "Fear of stagnation or being rooted in one place.",
    "directive": "Cultivate stability while remaining open to growth.",
    "practice": "Spend time in nature to connect with your roots.",
    "journal": "How can I balance stability and growth in my life?",
    "tags": [
      "resilience",
      "stability",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 223,
<<<<<<< Updated upstream
    "key": "Scorpio 14",
    "sign": "Scorpio",
    "degree": 14,
    "symbol": "Boundaries: A truth and depth moment is on the table.",
    "signal": "Limits protect value. Emphasize simplify.",
    "shadow": "Saying yes too fast costs you. Watch for control games.",
    "directive": "Set a boundary. Keep it truth and depth.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "simplify",
      "focus"
=======
    "key": "Scorpio_14",
    "sign": "Scorpio",
    "degree": 14,
    "symbol": "A mirror reflects a hidden truth.",
    "signal": "Self-awareness and confronting reality.",
    "shadow": "Denial and avoidance of uncomfortable truths.",
    "directive": "Practice radical honesty with yourself.",
    "practice": "Engage in self-inquiry to uncover deeper insights.",
    "journal": "What truths about myself have I been avoiding?",
    "tags": [
      "self-awareness",
      "truth",
      "honesty"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 224,
<<<<<<< Updated upstream
    "key": "Scorpio 15",
    "sign": "Scorpio",
    "degree": 15,
    "symbol": "Mirror: A truth and depth moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize simplify.",
    "shadow": "Defensiveness blocks learning. Watch for control games.",
    "directive": "Take the note. Keep it truth and depth.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "simplify",
      "focus"
=======
    "key": "Scorpio_15",
    "sign": "Scorpio",
    "degree": 15,
    "symbol": "A labyrinth invites exploration.",
    "signal": "The journey of self-discovery is complex.",
    "shadow": "Feeling overwhelmed by choices and paths.",
    "directive": "Embrace the journey, even when it feels confusing.",
    "practice": "Map out your goals and the steps to achieve them.",
    "journal": "What paths am I exploring, and what do they reveal about me?",
    "tags": [
      "self-discovery",
      "journey",
      "exploration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 225,
<<<<<<< Updated upstream
    "key": "Scorpio 16",
    "sign": "Scorpio",
    "degree": 16,
    "symbol": "Repair: A truth and depth moment is on the table.",
    "signal": "Something wants fixing. Emphasize simplify.",
    "shadow": "Avoidance compounds cost. Watch for control games.",
    "directive": "Repair it. Keep it truth and depth.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "simplify",
      "focus",
      "repair"
=======
    "key": "Scorpio_16",
    "sign": "Scorpio",
    "degree": 16,
    "symbol": "A bridge connects two shores.",
    "signal": "Building connections and overcoming divides.",
    "shadow": "Isolation and difficulty in forming relationships.",
    "directive": "Reach out to others and foster connections.",
    "practice": "Initiate a conversation with someone you’ve distanced from.",
    "journal": "What bridges can I build to connect with others?",
    "tags": [
      "connection",
      "relationships",
      "communication"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 226,
<<<<<<< Updated upstream
    "key": "Scorpio 17",
    "sign": "Scorpio",
    "degree": 17,
    "symbol": "Focus: A truth and depth moment is on the table.",
    "signal": "Attention is currency. Emphasize simplify.",
    "shadow": "Multitasking reduces quality. Watch for control games.",
    "directive": "Single-task. Keep it truth and depth.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "simplify"
=======
    "key": "Scorpio_17",
    "sign": "Scorpio",
    "degree": 17,
    "symbol": "A waterfall cascades down rocks.",
    "signal": "The flow of emotions and the cleansing power of release.",
    "shadow": "Holding onto emotions that need to be expressed.",
    "directive": "Allow your emotions to flow freely and cleanse your spirit.",
    "practice": "Engage in a physical activity that helps release pent-up emotions.",
    "journal": "What emotions am I ready to express and release?",
    "tags": [
      "emotions",
      "release",
      "cleansing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 227,
<<<<<<< Updated upstream
    "key": "Scorpio 18",
    "sign": "Scorpio",
    "degree": 18,
    "symbol": "Standard: A truth and depth moment is on the table.",
    "signal": "Quality needs definition. Emphasize simplify.",
    "shadow": "Vague standards create stress. Watch for control games.",
    "directive": "Define the standard. Keep it truth and depth.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "simplify",
      "focus",
      "standard"
=======
    "key": "Scorpio_18",
    "sign": "Scorpio",
    "degree": 18,
    "symbol": "A night sky filled with stars.",
    "signal": "Hope and possibilities beyond the present moment.",
    "shadow": "Feeling lost or disconnected from your aspirations.",
    "directive": "Dream big and reconnect with your vision for the future.",
    "practice": "Create a vision board to visualize your goals and dreams.",
    "journal": "What dreams have I set aside, and how can I revive them?",
    "tags": [
      "hope",
      "dreams",
      "vision"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 228,
<<<<<<< Updated upstream
    "key": "Scorpio 19",
    "sign": "Scorpio",
    "degree": 19,
    "symbol": "Tempo: A truth and depth moment is on the table.",
    "signal": "Timing matters. Emphasize simplify.",
    "shadow": "Forcing pace breaks form. Watch for control games.",
    "directive": "Set the pace. Keep it truth and depth.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "simplify",
      "tempo",
      "focus"
=======
    "key": "Scorpio_19",
    "sign": "Scorpio",
    "degree": 19,
    "symbol": "A woman in a flowing dress dances in the moonlight.",
    "signal": "Embrace your emotional depth and express it creatively.",
    "shadow": "Avoid suppressing feelings or hiding your true self.",
    "directive": "Engage in artistic activities that allow for emotional expression.",
    "practice": "Spend time in nature under the moonlight, reflecting on your emotions.",
    "journal": "How can I better express my emotions in my daily life?",
    "tags": [
      "creativity",
      "emotional expression",
      "artistic"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 229,
<<<<<<< Updated upstream
    "key": "Scorpio 20",
    "sign": "Scorpio",
    "degree": 20,
    "symbol": "Risk: A truth and depth moment is on the table.",
    "signal": "A calculated step is required. Emphasize simplify.",
    "shadow": "Impulse risk is not courage. Watch for control games.",
    "directive": "Take a measured risk. Keep it truth and depth.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "simplify",
      "focus",
      "risk"
=======
    "key": "Scorpio_20",
    "sign": "Scorpio",
    "degree": 20,
    "symbol": "A group of people gathered around a campfire.",
    "signal": "Foster connections and share experiences with others.",
    "shadow": "Beware of isolation or neglecting your social needs.",
    "directive": "Organize gatherings that encourage open dialogue and sharing.",
    "practice": "Host a small get-together to strengthen bonds with friends.",
    "journal": "What connections in my life need more attention and nurturing?",
    "tags": [
      "community",
      "connection",
      "sharing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 230,
<<<<<<< Updated upstream
    "key": "Scorpio 21",
    "sign": "Scorpio",
    "degree": 21,
    "symbol": "Integration: A truth and depth moment is on the table.",
    "signal": "Pieces want alignment. Emphasize simplify.",
    "shadow": "Fragmentation creates fatigue. Watch for control games.",
    "directive": "Integrate. Keep it truth and depth.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "simplify",
      "focus"
=======
    "key": "Scorpio_21",
    "sign": "Scorpio",
    "degree": 21,
    "symbol": "An artist painting a vibrant mural.",
    "signal": "Channel your passion into creative projects.",
    "shadow": "Avoid letting self-doubt stifle your creativity.",
    "directive": "Dedicate time each week to work on a creative endeavor.",
    "practice": "Experiment with different art forms to discover your unique style.",
    "journal": "What creative project have I been putting off, and why?",
    "tags": [
      "art",
      "creativity",
      "expression"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 231,
<<<<<<< Updated upstream
    "key": "Scorpio 22",
    "sign": "Scorpio",
    "degree": 22,
    "symbol": "Authority: A truth and depth moment is on the table.",
    "signal": "Own responsibility. Emphasize simplify.",
    "shadow": "Blame delays progress. Watch for control games.",
    "directive": "Take ownership. Keep it truth and depth.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "simplify",
      "authority",
      "focus"
=======
    "key": "Scorpio_22",
    "sign": "Scorpio",
    "degree": 22,
    "symbol": "A deep river flowing through a lush valley.",
    "signal": "Tap into your inner resources and intuition.",
    "shadow": "Resist the urge to ignore your instincts or inner voice.",
    "directive": "Practice mindfulness to connect with your deeper self.",
    "practice": "Engage in meditation or journaling to explore your thoughts.",
    "journal": "What does my intuition tell me about my current path?",
    "tags": [
      "intuition",
      "mindfulness",
      "self-discovery"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 232,
<<<<<<< Updated upstream
    "key": "Scorpio 23",
    "sign": "Scorpio",
    "degree": 23,
    "symbol": "Refine: A truth and depth moment is on the table.",
    "signal": "Polish after completion. Emphasize simplify.",
    "shadow": "Editing before finishing stalls. Watch for control games.",
    "directive": "Refine the finished draft. Keep it truth and depth.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "simplify",
      "focus"
=======
    "key": "Scorpio_23",
    "sign": "Scorpio",
    "degree": 23,
    "symbol": "A phoenix rising from the ashes.",
    "signal": "Embrace transformation and renewal in your life.",
    "shadow": "Avoid clinging to the past or resisting change.",
    "directive": "Identify areas in your life that need rejuvenation or change.",
    "practice": "Create a vision board to visualize your goals and transformations.",
    "journal": "What aspects of my life are ready for a fresh start?",
    "tags": [
      "transformation",
      "renewal",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 233,
<<<<<<< Updated upstream
    "key": "Scorpio 24",
    "sign": "Scorpio",
    "degree": 24,
    "symbol": "Stewardship: A truth and depth moment is on the table.",
    "signal": "Resources need care. Emphasize simplify.",
    "shadow": "Waste hides in habits. Watch for control games.",
    "directive": "Protect resources. Keep it truth and depth.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "simplify",
      "stewardship"
=======
    "key": "Scorpio_24",
    "sign": "Scorpio",
    "degree": 24,
    "symbol": "A key unlocking a treasure chest.",
    "signal": "Discover hidden talents and resources within yourself.",
    "shadow": "Beware of underestimating your abilities or potential.",
    "directive": "Explore new skills or hobbies that pique your interest.",
    "practice": "Take a class or workshop to develop a new talent.",
    "journal": "What hidden talents do I have that I have yet to explore?",
    "tags": [
      "talent",
      "discovery",
      "potential"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 234,
<<<<<<< Updated upstream
    "key": "Scorpio 25",
    "sign": "Scorpio",
    "degree": 25,
    "symbol": "Signal-to-noise: A truth and depth moment is on the table.",
    "signal": "Simplify inputs. Emphasize simplify.",
    "shadow": "Overconsumption clouds judgment. Watch for control games.",
    "directive": "Reduce intake. Keep it truth and depth.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "simplify",
      "focus"
=======
    "key": "Scorpio_25",
    "sign": "Scorpio",
    "degree": 25,
    "symbol": "A wise elder sharing knowledge with youth.",
    "signal": "Share your wisdom and experiences with others.",
    "shadow": "Avoid being dismissive of others' perspectives or experiences.",
    "directive": "Mentor someone or engage in knowledge-sharing activities.",
    "practice": "Volunteer to teach or guide others in your area of expertise.",
    "journal": "What lessons have I learned that I can share with others?",
    "tags": [
      "wisdom",
      "mentorship",
      "sharing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 235,
<<<<<<< Updated upstream
    "key": "Scorpio 26",
    "sign": "Scorpio",
    "degree": 26,
    "symbol": "Sustain: A truth and depth moment is on the table.",
    "signal": "Make it last. Emphasize simplify.",
    "shadow": "Burnout follows spikes. Watch for control games.",
    "directive": "Sustain. Keep it truth and depth.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "simplify",
      "sustain",
      "focus"
=======
    "key": "Scorpio_26",
    "sign": "Scorpio",
    "degree": 26,
    "symbol": "A stormy sea with a lighthouse in the distance.",
    "signal": "Navigate through emotional turbulence with clarity.",
    "shadow": "Beware of becoming overwhelmed by your emotions.",
    "directive": "Develop coping strategies for managing emotional upheaval.",
    "practice": "Create a self-care routine that includes grounding activities.",
    "journal": "How do I typically respond to emotional challenges?",
    "tags": [
      "emotions",
      "navigation",
      "self-care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 236,
<<<<<<< Updated upstream
    "key": "Scorpio 27",
    "sign": "Scorpio",
    "degree": 27,
    "symbol": "Legacy: A truth and depth moment is on the table.",
    "signal": "Long-term view matters. Emphasize simplify.",
    "shadow": "Short-term ego derails. Watch for control games.",
    "directive": "Think long. Keep it truth and depth.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "simplify",
      "legacy",
      "stewardship"
=======
    "key": "Scorpio_27",
    "sign": "Scorpio",
    "degree": 27,
    "symbol": "A garden flourishing with diverse plants.",
    "signal": "Cultivate diversity and richness in your life.",
    "shadow": "Avoid limiting yourself to familiar patterns or routines.",
    "directive": "Seek out new experiences and perspectives that challenge you.",
    "practice": "Try a new hobby or visit a place you've never been.",
    "journal": "What new experiences can I invite into my life?",
    "tags": [
      "diversity",
      "growth",
      "experience"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 237,
<<<<<<< Updated upstream
    "key": "Scorpio 28",
    "sign": "Scorpio",
    "degree": 28,
    "symbol": "Closure: A truth and depth moment is on the table.",
    "signal": "Finish cycles. Emphasize simplify.",
    "shadow": "Open loops drain attention. Watch for control games.",
    "directive": "Close the loop. Keep it truth and depth.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "simplify",
      "focus"
=======
    "key": "Scorpio_28",
    "sign": "Scorpio",
    "degree": 28,
    "symbol": "A mountain climber reaching the summit.",
    "signal": "Pursue your goals with determination and resilience.",
    "shadow": "Beware of giving up too easily in the face of challenges.",
    "directive": "Set clear goals and outline steps to achieve them.",
    "practice": "Create a plan for overcoming obstacles in your path.",
    "journal": "What challenges am I currently facing, and how can I overcome them?",
    "tags": [
      "goals",
      "determination",
      "resilience"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 238,
<<<<<<< Updated upstream
    "key": "Scorpio 29",
    "sign": "Scorpio",
    "degree": 29,
    "symbol": "Threshold: A truth and depth moment is on the table.",
    "signal": "A transition is near. Emphasize simplify.",
    "shadow": "Hesitation creates drift. Watch for control games.",
    "directive": "Cross the threshold. Keep it truth and depth.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "simplify",
      "focus"
=======
    "key": "Scorpio_29",
    "sign": "Scorpio",
    "degree": 29,
    "symbol": "A lantern illuminating a dark path.",
    "signal": "Seek clarity and understanding in uncertain situations.",
    "shadow": "Avoid allowing fear of the unknown to paralyze you.",
    "directive": "Ask questions and seek information to dispel confusion.",
    "practice": "Engage in research or discussions to gain insights.",
    "journal": "What uncertainties in my life need more clarity?",
    "tags": [
      "clarity",
      "understanding",
      "insight"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 239,
<<<<<<< Updated upstream
    "key": "Scorpio 30",
    "sign": "Scorpio",
    "degree": 30,
    "symbol": "Completion: A truth and depth moment is on the table.",
    "signal": "Harvest the result. Emphasize simplify.",
    "shadow": "Skipping review repeats mistakes. Watch for control games.",
    "directive": "Complete and review. Keep it truth and depth.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "simplify",
      "focus",
      "completion"
=======
    "key": "Scorpio_30",
    "sign": "Scorpio",
    "degree": 30,
    "symbol": "A butterfly emerging from a cocoon.",
    "signal": "Embrace personal growth and the journey of transformation.",
    "shadow": "Beware of resisting change or fearing vulnerability.",
    "directive": "Reflect on your growth and acknowledge your progress.",
    "practice": "Celebrate your achievements, no matter how small.",
    "journal": "In what ways have I transformed recently, and how can I continue to grow?",
    "tags": [
      "growth",
      "transformation",
      "celebration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 240,
<<<<<<< Updated upstream
    "key": "Sagittarius 1",
    "sign": "Sagittarius",
    "degree": 1,
    "symbol": "Start: A direction and meaning moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize aim.",
    "shadow": "Rushing creates rework. Watch for restless options.",
    "directive": "Start small and make it real. Keep it direction and meaning.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "aim",
      "start",
      "focus"
=======
    "key": "Sagittarius_1",
    "sign": "Sagittarius",
    "degree": 1,
    "symbol": "A new journey begins.",
    "signal": "Embrace new experiences with an open mind.",
    "shadow": "Fear of the unknown may hold you back.",
    "directive": "Take the first step towards a goal you've been contemplating.",
    "practice": "Set a small, achievable goal related to your aspirations and take action today.",
    "journal": "What new journey am I ready to embark on?",
    "tags": [
      "new beginnings",
      "adventure",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 241,
<<<<<<< Updated upstream
    "key": "Sagittarius 2",
    "sign": "Sagittarius",
    "degree": 2,
    "symbol": "Choice: A direction and meaning moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize aim.",
    "shadow": "Keeping both dilutes effort. Watch for restless options.",
    "directive": "Pick one lane and commit. Keep it direction and meaning.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "aim",
      "focus"
=======
    "key": "Sagittarius_2",
    "sign": "Sagittarius",
    "degree": 2,
    "symbol": "A compass points the way.",
    "signal": "Seek clarity in your direction.",
    "shadow": "Confusion about your path can lead to stagnation.",
    "directive": "Reflect on your core values to guide your decisions.",
    "practice": "Create a vision board that aligns with your values and aspirations.",
    "journal": "What values are guiding my current choices?",
    "tags": [
      "direction",
      "values",
      "clarity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 242,
<<<<<<< Updated upstream
    "key": "Sagittarius 3",
    "sign": "Sagittarius",
    "degree": 3,
    "symbol": "Signal: A direction and meaning moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize aim.",
    "shadow": "Noise hides the point. Watch for restless options.",
    "directive": "Name the signal and ignore the rest. Keep it direction and meaning.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "aim",
      "focus",
      "signal"
=======
    "key": "Sagittarius_3",
    "sign": "Sagittarius",
    "degree": 3,
    "symbol": "An open book reveals knowledge.",
    "signal": "Knowledge is a powerful tool for growth.",
    "shadow": "Ignoring opportunities for learning can limit your potential.",
    "directive": "Engage in a new learning experience or study a topic of interest.",
    "practice": "Dedicate time each week to read or take a course on something that excites you.",
    "journal": "What knowledge do I seek to expand my horizons?",
    "tags": [
      "learning",
      "knowledge",
      "expansion"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 243,
<<<<<<< Updated upstream
    "key": "Sagittarius 4",
    "sign": "Sagittarius",
    "degree": 4,
    "symbol": "Structure: A direction and meaning moment is on the table.",
    "signal": "A stable frame is needed. Emphasize aim.",
    "shadow": "Improvisation without a base collapses. Watch for restless options.",
    "directive": "Build the container first. Keep it direction and meaning.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "aim",
      "focus",
      "structure"
=======
    "key": "Sagittarius_4",
    "sign": "Sagittarius",
    "degree": 4,
    "symbol": "A gathering of diverse minds.",
    "signal": "Collaboration enhances creativity.",
    "shadow": "Isolation can stifle your ideas and growth.",
    "directive": "Reach out to others for collaboration or brainstorming.",
    "practice": "Join a group or community that shares your interests to exchange ideas.",
    "journal": "Who can I connect with to inspire new ideas?",
    "tags": [
      "collaboration",
      "community",
      "creativity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 244,
<<<<<<< Updated upstream
    "key": "Sagittarius 5",
    "sign": "Sagittarius",
    "degree": 5,
    "symbol": "Craft: A direction and meaning moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize aim.",
    "shadow": "Overthinking delays practice. Watch for restless options.",
    "directive": "Practice the fundamentals. Keep it direction and meaning.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "aim",
      "focus"
=======
    "key": "Sagittarius_5",
    "sign": "Sagittarius",
    "degree": 5,
    "symbol": "A flame ignites passion.",
    "signal": "Passion fuels your pursuits.",
    "shadow": "Lack of enthusiasm can lead to burnout.",
    "directive": "Identify what truly excites you and pursue it wholeheartedly.",
    "practice": "Engage in an activity that brings you joy and reignites your passion.",
    "journal": "What activities make me feel most alive?",
    "tags": [
      "passion",
      "enthusiasm",
      "energy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 245,
<<<<<<< Updated upstream
    "key": "Sagittarius 6",
    "sign": "Sagittarius",
    "degree": 6,
    "symbol": "Order: A direction and meaning moment is on the table.",
    "signal": "Details want sorting. Emphasize aim.",
    "shadow": "Perfectionism blocks delivery. Watch for restless options.",
    "directive": "Organize, then ship. Keep it direction and meaning.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "aim",
      "order",
      "focus"
=======
    "key": "Sagittarius_6",
    "sign": "Sagittarius",
    "degree": 6,
    "symbol": "A bridge connects two shores.",
    "signal": "Building connections is essential for growth.",
    "shadow": "Neglecting relationships can lead to missed opportunities.",
    "directive": "Strengthen a relationship that could benefit your personal or professional life.",
    "practice": "Reach out to someone you admire and express your appreciation or interest in collaboration.",
    "journal": "Which relationships need nurturing in my life?",
    "tags": [
      "connections",
      "relationships",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 246,
<<<<<<< Updated upstream
    "key": "Sagittarius 7",
    "sign": "Sagittarius",
    "degree": 7,
    "symbol": "Terms: A direction and meaning moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize aim.",
    "shadow": "Avoiding terms breeds friction. Watch for restless options.",
    "directive": "State expectations plainly. Keep it direction and meaning.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "aim",
      "terms",
      "focus"
=======
    "key": "Sagittarius_7",
    "sign": "Sagittarius",
    "degree": 7,
    "symbol": "A traveler explores new lands.",
    "signal": "Exploration leads to personal growth.",
    "shadow": "Staying in your comfort zone limits your experiences.",
    "directive": "Plan a trip or an exploration of a new place or idea.",
    "practice": "Take a day trip to a location you've never visited or try a new hobby.",
    "journal": "What new experiences am I eager to explore?",
    "tags": [
      "exploration",
      "travel",
      "adventure"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 247,
<<<<<<< Updated upstream
    "key": "Sagittarius 8",
    "sign": "Sagittarius",
    "degree": 8,
    "symbol": "Depth: A direction and meaning moment is on the table.",
    "signal": "A hidden factor matters. Emphasize aim.",
    "shadow": "Control replaces honesty. Watch for restless options.",
    "directive": "Confront the real issue. Keep it direction and meaning.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "aim",
      "depth",
      "focus"
=======
    "key": "Sagittarius_8",
    "sign": "Sagittarius",
    "degree": 8,
    "symbol": "A wise elder shares insights.",
    "signal": "Wisdom comes from experience and sharing.",
    "shadow": "Ignoring advice can lead to repeated mistakes.",
    "directive": "Seek guidance from someone with more experience in your field.",
    "practice": "Schedule a mentorship session or coffee chat with a mentor or elder.",
    "journal": "What wisdom do I need to seek to avoid past mistakes?",
    "tags": [
      "wisdom",
      "mentorship",
      "guidance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 248,
<<<<<<< Updated upstream
    "key": "Sagittarius 9",
    "sign": "Sagittarius",
    "degree": 9,
    "symbol": "Aim: A direction and meaning moment is on the table.",
    "signal": "A goal needs meaning. Emphasize aim.",
    "shadow": "Drift wastes time. Watch for restless options.",
    "directive": "Choose direction. Keep it direction and meaning.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "focus"
=======
    "key": "Sagittarius_9",
    "sign": "Sagittarius",
    "degree": 9,
    "symbol": "A star shines brightly in the night.",
    "signal": "Hope and inspiration illuminate your path.",
    "shadow": "Despair can cloud your vision.",
    "directive": "Focus on what inspires you and let it guide your actions.",
    "practice": "Create a list of your inspirations and revisit them regularly.",
    "journal": "What inspires me to keep moving forward?",
    "tags": [
      "inspiration",
      "hope",
      "guidance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 249,
<<<<<<< Updated upstream
    "key": "Sagittarius 10",
    "sign": "Sagittarius",
    "degree": 10,
    "symbol": "Ledger: A direction and meaning moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize aim.",
    "shadow": "Self-worth ties to output. Watch for restless options.",
    "directive": "Measure and adjust. Keep it direction and meaning.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "aim",
      "ledger",
      "stewardship"
=======
    "key": "Sagittarius_10",
    "sign": "Sagittarius",
    "degree": 10,
    "symbol": "A mountain peak offers a panoramic view.",
    "signal": "Perspective is key to understanding your journey.",
    "shadow": "Narrow focus can lead to missed opportunities.",
    "directive": "Step back and assess your situation from a broader perspective.",
    "practice": "Spend time in nature or a quiet space to reflect on your life’s journey.",
    "journal": "What broader perspective can I gain from my current challenges?",
    "tags": [
      "perspective",
      "reflection",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 250,
<<<<<<< Updated upstream
    "key": "Sagittarius 11",
    "sign": "Sagittarius",
    "degree": 11,
    "symbol": "Network: A direction and meaning moment is on the table.",
    "signal": "Support systems matter. Emphasize aim.",
    "shadow": "Isolation becomes a habit. Watch for restless options.",
    "directive": "Share the plan. Keep it direction and meaning.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "aim",
      "focus",
      "network"
=======
    "key": "Sagittarius_11",
    "sign": "Sagittarius",
    "degree": 11,
    "symbol": "A tapestry weaves together diverse threads.",
    "signal": "Unity in diversity enhances strength.",
    "shadow": "Division can weaken your efforts.",
    "directive": "Celebrate the diversity in your life and work towards unity.",
    "practice": "Engage in an activity that promotes inclusivity and understanding among different groups.",
    "journal": "How can I embrace diversity to strengthen my community?",
    "tags": [
      "unity",
      "diversity",
      "community"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 251,
<<<<<<< Updated upstream
    "key": "Sagittarius 12",
    "sign": "Sagittarius",
    "degree": 12,
    "symbol": "Reset: A direction and meaning moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize aim.",
    "shadow": "Escaping replaces rest. Watch for restless options.",
    "directive": "Pause and return with intent. Keep it direction and meaning.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "aim",
      "focus",
      "reset"
=======
    "key": "Sagittarius_12",
    "sign": "Sagittarius",
    "degree": 12,
    "symbol": "A lantern lights the dark path.",
    "signal": "Guidance is available when you seek it.",
    "shadow": "Ignoring your intuition can lead to confusion.",
    "directive": "Trust your intuition and seek guidance when needed.",
    "practice": "Meditate or journal to connect with your inner voice and clarify your path.",
    "journal": "What guidance do I need to trust my intuition more?",
    "tags": [
      "intuition",
      "guidance",
      "self-discovery"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 252,
    "key": "Sagittarius 13",
    "sign": "Sagittarius",
    "degree": 13,
<<<<<<< Updated upstream
    "symbol": "Commit: A direction and meaning moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize aim.",
    "shadow": "Half-commitment drains energy. Watch for restless options.",
    "directive": "Commit fully. Keep it direction and meaning.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "aim",
      "commit",
      "focus"
=======
    "symbol": "A wandering traveler seeks new horizons.",
    "signal": "Embrace exploration and the unknown.",
    "shadow": "Fear of venturing beyond comfort zones.",
    "directive": "Cultivate curiosity and openness to new experiences.",
    "practice": "Plan a short trip or engage in a new activity that challenges your routine.",
    "journal": "What fears hold me back from exploring new opportunities?",
    "tags": [
      "exploration",
      "curiosity",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 253,
    "key": "Sagittarius 14",
    "sign": "Sagittarius",
    "degree": 14,
<<<<<<< Updated upstream
    "symbol": "Boundaries: A direction and meaning moment is on the table.",
    "signal": "Limits protect value. Emphasize aim.",
    "shadow": "Saying yes too fast costs you. Watch for restless options.",
    "directive": "Set a boundary. Keep it direction and meaning.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "aim",
      "focus"
=======
    "symbol": "A group of people sharing stories around a fire.",
    "signal": "The power of community and shared experiences.",
    "shadow": "Isolation and reluctance to connect with others.",
    "directive": "Engage with your community and share your journey.",
    "practice": "Host a gathering or participate in a local event to connect with others.",
    "journal": "How can I contribute to my community's narrative?",
    "tags": [
      "community",
      "connection",
      "storytelling"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 254,
    "key": "Sagittarius 15",
    "sign": "Sagittarius",
    "degree": 15,
<<<<<<< Updated upstream
    "symbol": "Mirror: A direction and meaning moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize aim.",
    "shadow": "Defensiveness blocks learning. Watch for restless options.",
    "directive": "Take the note. Keep it direction and meaning.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "aim",
      "focus"
=======
    "symbol": "An archer aiming for a distant target.",
    "signal": "Focus on long-term goals and aspirations.",
    "shadow": "Distraction and lack of clarity in intentions.",
    "directive": "Define your goals and create a plan to achieve them.",
    "practice": "Write down your top three long-term goals and outline actionable steps.",
    "journal": "What is my ultimate target, and what steps am I taking to reach it?",
    "tags": [
      "goals",
      "focus",
      "aspiration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 255,
    "key": "Sagittarius 16",
    "sign": "Sagittarius",
    "degree": 16,
<<<<<<< Updated upstream
    "symbol": "Repair: A direction and meaning moment is on the table.",
    "signal": "Something wants fixing. Emphasize aim.",
    "shadow": "Avoidance compounds cost. Watch for restless options.",
    "directive": "Repair it. Keep it direction and meaning.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "aim",
      "focus",
      "repair"
=======
    "symbol": "A philosopher deep in thought.",
    "signal": "The pursuit of knowledge and understanding.",
    "shadow": "Overthinking and getting lost in abstract ideas.",
    "directive": "Seek practical applications for your insights.",
    "practice": "Choose a philosophical text and discuss its relevance to your life.",
    "journal": "How can I apply my knowledge to improve my daily life?",
    "tags": [
      "knowledge",
      "philosophy",
      "application"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 256,
    "key": "Sagittarius 17",
    "sign": "Sagittarius",
    "degree": 17,
<<<<<<< Updated upstream
    "symbol": "Focus: A direction and meaning moment is on the table.",
    "signal": "Attention is currency. Emphasize aim.",
    "shadow": "Multitasking reduces quality. Watch for restless options.",
    "directive": "Single-task. Keep it direction and meaning.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "aim"
=======
    "symbol": "A vibrant marketplace bustling with activity.",
    "signal": "The exchange of ideas and commerce.",
    "shadow": "Fear of competition and feeling overwhelmed.",
    "directive": "Engage in networking and collaboration.",
    "practice": "Attend a local market or networking event to connect with others.",
    "journal": "What unique value do I bring to my community or network?",
    "tags": [
      "networking",
      "exchange",
      "community"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 257,
    "key": "Sagittarius 18",
    "sign": "Sagittarius",
    "degree": 18,
<<<<<<< Updated upstream
    "symbol": "Standard: A direction and meaning moment is on the table.",
    "signal": "Quality needs definition. Emphasize aim.",
    "shadow": "Vague standards create stress. Watch for restless options.",
    "directive": "Define the standard. Keep it direction and meaning.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "aim",
      "focus",
      "standard"
=======
    "symbol": "A teacher guiding eager students.",
    "signal": "The importance of mentorship and sharing wisdom.",
    "shadow": "Neglecting to share your knowledge with others.",
    "directive": "Take on a mentoring role or share your expertise.",
    "practice": "Volunteer to teach a skill or lead a workshop.",
    "journal": "Who can I mentor, and what knowledge can I share?",
    "tags": [
      "mentorship",
      "teaching",
      "wisdom"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 258,
    "key": "Sagittarius 19",
    "sign": "Sagittarius",
    "degree": 19,
<<<<<<< Updated upstream
    "symbol": "Tempo: A direction and meaning moment is on the table.",
    "signal": "Timing matters. Emphasize aim.",
    "shadow": "Forcing pace breaks form. Watch for restless options.",
    "directive": "Set the pace. Keep it direction and meaning.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "aim",
      "tempo",
      "focus"
=======
    "symbol": "A compass pointing towards the north.",
    "signal": "Finding direction and purpose in life.",
    "shadow": "Feeling lost or directionless.",
    "directive": "Reflect on your values and what guides you.",
    "practice": "Create a vision board that represents your values and goals.",
    "journal": "What values guide my decisions and direction in life?",
    "tags": [
      "direction",
      "purpose",
      "values"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 259,
    "key": "Sagittarius 20",
    "sign": "Sagittarius",
    "degree": 20,
<<<<<<< Updated upstream
    "symbol": "Risk: A direction and meaning moment is on the table.",
    "signal": "A calculated step is required. Emphasize aim.",
    "shadow": "Impulse risk is not courage. Watch for restless options.",
    "directive": "Take a measured risk. Keep it direction and meaning.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "aim",
      "focus",
      "risk"
=======
    "symbol": "A bridge connecting two shores.",
    "signal": "Building connections and overcoming divides.",
    "shadow": "Resistance to collaboration and communication.",
    "directive": "Reach out to someone with whom you have differences.",
    "practice": "Initiate a dialogue with someone from a different background.",
    "journal": "What bridges can I build to enhance my relationships?",
    "tags": [
      "connection",
      "communication",
      "collaboration"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 260,
    "key": "Sagittarius 21",
    "sign": "Sagittarius",
    "degree": 21,
<<<<<<< Updated upstream
    "symbol": "Integration: A direction and meaning moment is on the table.",
    "signal": "Pieces want alignment. Emphasize aim.",
    "shadow": "Fragmentation creates fatigue. Watch for restless options.",
    "directive": "Integrate. Keep it direction and meaning.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "aim",
      "focus"
=======
    "symbol": "A mountain climber reaching a summit.",
    "signal": "Achievement and the rewards of hard work.",
    "shadow": "Fear of failure and reluctance to take risks.",
    "directive": "Celebrate your achievements and set new challenges.",
    "practice": "Reflect on a recent accomplishment and plan your next challenge.",
    "journal": "What challenges have I overcome, and what’s next on my journey?",
    "tags": [
      "achievement",
      "challenge",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 261,
    "key": "Sagittarius 22",
    "sign": "Sagittarius",
    "degree": 22,
<<<<<<< Updated upstream
    "symbol": "Authority: A direction and meaning moment is on the table.",
    "signal": "Own responsibility. Emphasize aim.",
    "shadow": "Blame delays progress. Watch for restless options.",
    "directive": "Take ownership. Keep it direction and meaning.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "aim",
      "authority",
      "focus"
=======
    "symbol": "A wise elder sharing life lessons.",
    "signal": "The value of experience and reflection.",
    "shadow": "Ignoring the lessons of the past.",
    "directive": "Reflect on your past experiences and their teachings.",
    "practice": "Write a letter to your younger self sharing key insights.",
    "journal": "What lessons from my past can guide my present decisions?",
    "tags": [
      "wisdom",
      "reflection",
      "experience"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 262,
    "key": "Sagittarius 23",
    "sign": "Sagittarius",
    "degree": 23,
<<<<<<< Updated upstream
    "symbol": "Refine: A direction and meaning moment is on the table.",
    "signal": "Polish after completion. Emphasize aim.",
    "shadow": "Editing before finishing stalls. Watch for restless options.",
    "directive": "Refine the finished draft. Keep it direction and meaning.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "aim",
      "focus"
=======
    "symbol": "A traveler documenting their journey.",
    "signal": "The importance of recording experiences.",
    "shadow": "Neglecting to reflect on or document your life.",
    "directive": "Keep a journal or create a scrapbook of your experiences.",
    "practice": "Dedicate time to write about your recent experiences and insights.",
    "journal": "How can documenting my journey enhance my understanding of it?",
    "tags": [
      "documentation",
      "reflection",
      "experience"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 263,
    "key": "Sagittarius 24",
    "sign": "Sagittarius",
    "degree": 24,
<<<<<<< Updated upstream
    "symbol": "Stewardship: A direction and meaning moment is on the table.",
    "signal": "Resources need care. Emphasize aim.",
    "shadow": "Waste hides in habits. Watch for restless options.",
    "directive": "Protect resources. Keep it direction and meaning.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "aim",
      "stewardship"
=======
    "symbol": "A lantern illuminating a dark path.",
    "signal": "Finding clarity in uncertainty.",
    "shadow": "Being overwhelmed by confusion or doubt.",
    "directive": "Seek clarity and illumination in your current situation.",
    "practice": "Meditate on a current challenge and visualize a clear path forward.",
    "journal": "What steps can I take to bring clarity to my current situation?",
    "tags": [
      "clarity",
      "insight",
      "guidance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 264,
    "key": "Sagittarius 25",
    "sign": "Sagittarius",
    "degree": 25,
<<<<<<< Updated upstream
    "symbol": "Signal-to-noise: A direction and meaning moment is on the table.",
    "signal": "Simplify inputs. Emphasize aim.",
    "shadow": "Overconsumption clouds judgment. Watch for restless options.",
    "directive": "Reduce intake. Keep it direction and meaning.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "aim",
      "focus"
=======
    "symbol": "A group of people gathered for a celebration.",
    "signal": "Community and shared joy.",
    "shadow": "Isolation and disconnection.",
    "directive": "Engage with your community and celebrate collective achievements.",
    "practice": "Organize or participate in a local event to foster connections.",
    "journal": "What role do I play in my community's celebrations?",
    "tags": [
      "community",
      "celebration",
      "connection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 265,
    "key": "Sagittarius 26",
    "sign": "Sagittarius",
    "degree": 26,
<<<<<<< Updated upstream
    "symbol": "Sustain: A direction and meaning moment is on the table.",
    "signal": "Make it last. Emphasize aim.",
    "shadow": "Burnout follows spikes. Watch for restless options.",
    "directive": "Sustain. Keep it direction and meaning.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "aim",
      "sustain",
      "focus"
=======
    "symbol": "A traveler exploring new landscapes.",
    "signal": "Adventure and discovery.",
    "shadow": "Fear of the unknown.",
    "directive": "Embrace new experiences that broaden your horizons.",
    "practice": "Plan a trip or explore a new area in your city.",
    "journal": "What fears hold me back from exploring new opportunities?",
    "tags": [
      "adventure",
      "exploration",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 266,
    "key": "Sagittarius 27",
    "sign": "Sagittarius",
    "degree": 27,
<<<<<<< Updated upstream
    "symbol": "Legacy: A direction and meaning moment is on the table.",
    "signal": "Long-term view matters. Emphasize aim.",
    "shadow": "Short-term ego derails. Watch for restless options.",
    "directive": "Think long. Keep it direction and meaning.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "aim",
      "legacy",
      "stewardship"
=======
    "symbol": "A teacher imparting knowledge to eager students.",
    "signal": "Wisdom and mentorship.",
    "shadow": "Arrogance and dismissiveness.",
    "directive": "Share your knowledge and experiences with others.",
    "practice": "Mentor someone or lead a workshop in your area of expertise.",
    "journal": "How can I better share my knowledge with those around me?",
    "tags": [
      "teaching",
      "mentorship",
      "wisdom"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 267,
    "key": "Sagittarius 28",
    "sign": "Sagittarius",
    "degree": 28,
<<<<<<< Updated upstream
    "symbol": "Closure: A direction and meaning moment is on the table.",
    "signal": "Finish cycles. Emphasize aim.",
    "shadow": "Open loops drain attention. Watch for restless options.",
    "directive": "Close the loop. Keep it direction and meaning.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "aim",
      "focus"
=======
    "symbol": "A ship sailing into uncharted waters.",
    "signal": "Courage and exploration.",
    "shadow": "Stagnation and fear of change.",
    "directive": "Take calculated risks that lead to personal growth.",
    "practice": "Identify a risk you've been avoiding and take the first step.",
    "journal": "What uncharted territory am I ready to explore in my life?",
    "tags": [
      "risk",
      "exploration",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 268,
    "key": "Sagittarius 29",
    "sign": "Sagittarius",
    "degree": 29,
<<<<<<< Updated upstream
    "symbol": "Threshold: A direction and meaning moment is on the table.",
    "signal": "A transition is near. Emphasize aim.",
    "shadow": "Hesitation creates drift. Watch for restless options.",
    "directive": "Cross the threshold. Keep it direction and meaning.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "aim",
      "focus"
=======
    "symbol": "A wise elder sharing stories of the past.",
    "signal": "Tradition and legacy.",
    "shadow": "Resistance to change and outdated beliefs.",
    "directive": "Honor your roots while remaining open to new ideas.",
    "practice": "Reflect on your heritage and how it shapes your current beliefs.",
    "journal": "What stories from my past influence my present decisions?",
    "tags": [
      "tradition",
      "legacy",
      "reflection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 269,
    "key": "Sagittarius 30",
    "sign": "Sagittarius",
    "degree": 30,
<<<<<<< Updated upstream
    "symbol": "Completion: A direction and meaning moment is on the table.",
    "signal": "Harvest the result. Emphasize aim.",
    "shadow": "Skipping review repeats mistakes. Watch for restless options.",
    "directive": "Complete and review. Keep it direction and meaning.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "aim",
      "focus",
      "completion"
=======
    "symbol": "A firework display lighting up the night sky.",
    "signal": "Celebration and inspiration.",
    "shadow": "Burnout and fleeting moments of joy.",
    "directive": "Find ways to ignite passion and enthusiasm in your life.",
    "practice": "Create a vision board that reflects your dreams and aspirations.",
    "journal": "What sparks joy and inspiration in my daily life?",
    "tags": [
      "celebration",
      "inspiration",
      "passion"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 270,
    "key": "Capricorn 1",
    "sign": "Capricorn",
    "degree": 1,
<<<<<<< Updated upstream
    "symbol": "Start: A standards and stewardship moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize build.",
    "shadow": "Rushing creates rework. Watch for overwork.",
    "directive": "Start small and make it real. Keep it standards and stewardship.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "focus",
      "start",
      "build"
=======
    "symbol": "A mountain climber reaching the summit.",
    "signal": "Achievement and perseverance.",
    "shadow": "Overwhelm and burnout.",
    "directive": "Set clear goals and take steady steps towards them.",
    "practice": "Outline your short-term and long-term goals with actionable steps.",
    "journal": "What is my next summit, and how will I reach it?",
    "tags": [
      "achievement",
      "goals",
      "perseverance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 271,
    "key": "Capricorn 2",
    "sign": "Capricorn",
    "degree": 2,
<<<<<<< Updated upstream
    "symbol": "Choice: A standards and stewardship moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize build.",
    "shadow": "Keeping both dilutes effort. Watch for overwork.",
    "directive": "Pick one lane and commit. Keep it standards and stewardship.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "focus",
      "build"
=======
    "symbol": "A business meeting in progress.",
    "signal": "Collaboration and strategy.",
    "shadow": "Conflict and miscommunication.",
    "directive": "Foster teamwork and clear communication in your endeavors.",
    "practice": "Schedule a meeting to discuss goals and align with your team.",
    "journal": "How can I improve communication within my team?",
    "tags": [
      "collaboration",
      "strategy",
      "communication"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 272,
    "key": "Capricorn 3",
    "sign": "Capricorn",
    "degree": 3,
<<<<<<< Updated upstream
    "symbol": "Signal: A standards and stewardship moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize build.",
    "shadow": "Noise hides the point. Watch for overwork.",
    "directive": "Name the signal and ignore the rest. Keep it standards and stewardship.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "focus",
      "build",
      "signal"
=======
    "symbol": "A gardener tending to a thriving garden.",
    "signal": "Nurturing and growth.",
    "shadow": "Neglect and stagnation.",
    "directive": "Invest time in nurturing your personal and professional projects.",
    "practice": "Dedicate time each week to develop a skill or project you care about.",
    "journal": "What areas of my life need more nurturing and attention?",
    "tags": [
      "nurturing",
      "growth",
      "development"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 273,
    "key": "Capricorn 4",
    "sign": "Capricorn",
    "degree": 4,
<<<<<<< Updated upstream
    "symbol": "Structure: A standards and stewardship moment is on the table.",
    "signal": "A stable frame is needed. Emphasize build.",
    "shadow": "Improvisation without a base collapses. Watch for overwork.",
    "directive": "Build the container first. Keep it standards and stewardship.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "focus",
      "build",
      "structure"
=======
    "symbol": "A stone bridge connecting two lands.",
    "signal": "Connection and support.",
    "shadow": "Isolation and division.",
    "directive": "Build bridges in your relationships and networks.",
    "practice": "Reach out to someone you haven’t spoken to in a while.",
    "journal": "Who can I reconnect with to strengthen my support system?",
    "tags": [
      "connection",
      "support",
      "relationships"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 274,
    "key": "Capricorn 5",
    "sign": "Capricorn",
    "degree": 5,
<<<<<<< Updated upstream
    "symbol": "Craft: A standards and stewardship moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize build.",
    "shadow": "Overthinking delays practice. Watch for overwork.",
    "directive": "Practice the fundamentals. Keep it standards and stewardship.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "focus",
      "build"
=======
    "symbol": "A clock tower standing tall in a bustling town.",
    "signal": "Time management and structure.",
    "shadow": "Chaos and disorganization.",
    "directive": "Establish routines that promote productivity and balance.",
    "practice": "Create a daily schedule that prioritizes your tasks effectively.",
    "journal": "How can I better manage my time to achieve my goals?",
    "tags": [
      "time management",
      "structure",
      "productivity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 275,
    "key": "Capricorn 6",
    "sign": "Capricorn",
    "degree": 6,
<<<<<<< Updated upstream
    "symbol": "Order: A standards and stewardship moment is on the table.",
    "signal": "Details want sorting. Emphasize build.",
    "shadow": "Perfectionism blocks delivery. Watch for overwork.",
    "directive": "Organize, then ship. Keep it standards and stewardship.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "focus",
      "build",
      "order"
=======
    "symbol": "A mountain range under a clear sky.",
    "signal": "Stability and clarity.",
    "shadow": "Uncertainty and instability.",
    "directive": "Seek clarity in your ambitions and values.",
    "practice": "Reflect on your core values and how they align with your goals.",
    "journal": "What values guide my decisions and ambitions?",
    "tags": [
      "clarity",
      "values",
      "stability"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 276,
<<<<<<< Updated upstream
    "key": "Capricorn 7",
    "sign": "Capricorn",
    "degree": 7,
    "symbol": "Terms: A standards and stewardship moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize build.",
    "shadow": "Avoiding terms breeds friction. Watch for overwork.",
    "directive": "State expectations plainly. Keep it standards and stewardship.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "focus",
      "build",
      "terms"
=======
    "key": "Capricorn_7",
    "sign": "Capricorn",
    "degree": 7,
    "symbol": "A mountain climber reaching the summit.",
    "signal": "Achievement through perseverance.",
    "shadow": "Fear of failure and self-doubt.",
    "directive": "Focus on setting realistic goals and celebrate small victories.",
    "practice": "Create a vision board that outlines your aspirations and milestones.",
    "journal": "What small steps can I take today to move closer to my goals?",
    "tags": [
      "achievement",
      "perseverance",
      "goals"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 277,
<<<<<<< Updated upstream
    "key": "Capricorn 8",
    "sign": "Capricorn",
    "degree": 8,
    "symbol": "Depth: A standards and stewardship moment is on the table.",
    "signal": "A hidden factor matters. Emphasize build.",
    "shadow": "Control replaces honesty. Watch for overwork.",
    "directive": "Confront the real issue. Keep it standards and stewardship.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "focus",
      "depth",
      "build"
=======
    "key": "Capricorn_8",
    "sign": "Capricorn",
    "degree": 8,
    "symbol": "A wise elder sharing knowledge.",
    "signal": "Value in mentorship and guidance.",
    "shadow": "Ignoring the wisdom of experience.",
    "directive": "Seek out mentors or become one for others.",
    "practice": "Engage in a conversation with someone you admire for their insights.",
    "journal": "What lessons have I learned that I can share with others?",
    "tags": [
      "mentorship",
      "wisdom",
      "guidance"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 278,
<<<<<<< Updated upstream
    "key": "Capricorn 9",
    "sign": "Capricorn",
    "degree": 9,
    "symbol": "Aim: A standards and stewardship moment is on the table.",
    "signal": "A goal needs meaning. Emphasize build.",
    "shadow": "Drift wastes time. Watch for overwork.",
    "directive": "Choose direction. Keep it standards and stewardship.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "build",
      "focus"
=======
    "key": "Capricorn_9",
    "sign": "Capricorn",
    "degree": 9,
    "symbol": "A ship navigating through rough waters.",
    "signal": "Resilience in the face of challenges.",
    "shadow": "Avoiding difficult situations.",
    "directive": "Embrace challenges as opportunities for growth.",
    "practice": "Identify a current challenge and outline steps to address it.",
    "journal": "How can I turn my current obstacles into opportunities?",
    "tags": [
      "resilience",
      "challenges",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 279,
<<<<<<< Updated upstream
    "key": "Capricorn 10",
    "sign": "Capricorn",
    "degree": 10,
    "symbol": "Ledger: A standards and stewardship moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize build.",
    "shadow": "Self-worth ties to output. Watch for overwork.",
    "directive": "Measure and adjust. Keep it standards and stewardship.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "ledger",
      "build",
      "stewardship"
=======
    "key": "Capricorn_10",
    "sign": "Capricorn",
    "degree": 10,
    "symbol": "A community gathering to celebrate achievements.",
    "signal": "The importance of collective success.",
    "shadow": "Isolation and reluctance to share success.",
    "directive": "Engage with your community and share your accomplishments.",
    "practice": "Organize or attend a local event to connect with others.",
    "journal": "Who can I celebrate my successes with today?",
    "tags": [
      "community",
      "celebration",
      "success"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 280,
<<<<<<< Updated upstream
    "key": "Capricorn 11",
    "sign": "Capricorn",
    "degree": 11,
    "symbol": "Network: A standards and stewardship moment is on the table.",
    "signal": "Support systems matter. Emphasize build.",
    "shadow": "Isolation becomes a habit. Watch for overwork.",
    "directive": "Share the plan. Keep it standards and stewardship.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "focus",
      "build",
      "network"
=======
    "key": "Capricorn_11",
    "sign": "Capricorn",
    "degree": 11,
    "symbol": "A sculptor chiseling a masterpiece.",
    "signal": "Crafting your reality with intention.",
    "shadow": "Fear of imperfection and procrastination.",
    "directive": "Take action towards your creative endeavors.",
    "practice": "Dedicate time to a project that reflects your vision.",
    "journal": "What creative project have I been putting off, and why?",
    "tags": [
      "creativity",
      "intention",
      "action"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 281,
<<<<<<< Updated upstream
    "key": "Capricorn 12",
    "sign": "Capricorn",
    "degree": 12,
    "symbol": "Reset: A standards and stewardship moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize build.",
    "shadow": "Escaping replaces rest. Watch for overwork.",
    "directive": "Pause and return with intent. Keep it standards and stewardship.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "focus",
      "build",
      "reset"
=======
    "key": "Capricorn_12",
    "sign": "Capricorn",
    "degree": 12,
    "symbol": "A bridge connecting two shores.",
    "signal": "Building connections and relationships.",
    "shadow": "Fear of vulnerability in relationships.",
    "directive": "Reach out to someone you’ve lost touch with.",
    "practice": "Send a message or make a call to reconnect.",
    "journal": "Who in my life could use a reconnection, and what would I say?",
    "tags": [
      "connections",
      "relationships",
      "vulnerability"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 282,
<<<<<<< Updated upstream
    "key": "Capricorn 13",
    "sign": "Capricorn",
    "degree": 13,
    "symbol": "Commit: A standards and stewardship moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize build.",
    "shadow": "Half-commitment drains energy. Watch for overwork.",
    "directive": "Commit fully. Keep it standards and stewardship.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "focus",
      "commit",
      "build"
=======
    "key": "Capricorn_13",
    "sign": "Capricorn",
    "degree": 13,
    "symbol": "A clock ticking steadily.",
    "signal": "The importance of timing and patience.",
    "shadow": "Impatience and rushing through processes.",
    "directive": "Practice patience in your current endeavors.",
    "practice": "Set a timer for a task and focus solely on it without distractions.",
    "journal": "What areas of my life require more patience and why?",
    "tags": [
      "timing",
      "patience",
      "focus"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 283,
<<<<<<< Updated upstream
    "key": "Capricorn 14",
    "sign": "Capricorn",
    "degree": 14,
    "symbol": "Boundaries: A standards and stewardship moment is on the table.",
    "signal": "Limits protect value. Emphasize build.",
    "shadow": "Saying yes too fast costs you. Watch for overwork.",
    "directive": "Set a boundary. Keep it standards and stewardship.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "focus",
      "build"
=======
    "key": "Capricorn_14",
    "sign": "Capricorn",
    "degree": 14,
    "symbol": "A farmer tending to his crops.",
    "signal": "Nurturing growth through hard work.",
    "shadow": "Neglecting responsibilities and commitments.",
    "directive": "Commit to nurturing your personal and professional projects.",
    "practice": "Create a care plan for a goal you wish to develop.",
    "journal": "What commitments have I neglected that need my attention?",
    "tags": [
      "nurturing",
      "commitment",
      "growth"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 284,
<<<<<<< Updated upstream
    "key": "Capricorn 15",
    "sign": "Capricorn",
    "degree": 15,
    "symbol": "Mirror: A standards and stewardship moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize build.",
    "shadow": "Defensiveness blocks learning. Watch for overwork.",
    "directive": "Take the note. Keep it standards and stewardship.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "build",
      "focus"
=======
    "key": "Capricorn_15",
    "sign": "Capricorn",
    "degree": 15,
    "symbol": "A lighthouse guiding ships safely.",
    "signal": "Providing guidance and support to others.",
    "shadow": "Overextending yourself to help others.",
    "directive": "Balance your support for others with self-care.",
    "practice": "Set boundaries to protect your energy while helping others.",
    "journal": "How can I support others without compromising my own well-being?",
    "tags": [
      "guidance",
      "support",
      "boundaries"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 285,
<<<<<<< Updated upstream
    "key": "Capricorn 16",
    "sign": "Capricorn",
    "degree": 16,
    "symbol": "Repair: A standards and stewardship moment is on the table.",
    "signal": "Something wants fixing. Emphasize build.",
    "shadow": "Avoidance compounds cost. Watch for overwork.",
    "directive": "Repair it. Keep it standards and stewardship.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "focus",
      "build",
      "repair"
=======
    "key": "Capricorn_16",
    "sign": "Capricorn",
    "degree": 16,
    "symbol": "A mountain range under a clear sky.",
    "signal": "Clarity of vision and purpose.",
    "shadow": "Feeling lost or directionless.",
    "directive": "Clarify your long-term goals and aspirations.",
    "practice": "Write down your vision for the next five years.",
    "journal": "What is my ultimate goal, and what steps will I take to achieve it?",
    "tags": [
      "clarity",
      "vision",
      "purpose"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 286,
<<<<<<< Updated upstream
    "key": "Capricorn 17",
    "sign": "Capricorn",
    "degree": 17,
    "symbol": "Focus: A standards and stewardship moment is on the table.",
    "signal": "Attention is currency. Emphasize build.",
    "shadow": "Multitasking reduces quality. Watch for overwork.",
    "directive": "Single-task. Keep it standards and stewardship.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "build"
=======
    "key": "Capricorn_17",
    "sign": "Capricorn",
    "degree": 17,
    "symbol": "A well-constructed building.",
    "signal": "The importance of a solid foundation.",
    "shadow": "Rushing into projects without planning.",
    "directive": "Assess the foundations of your current projects.",
    "practice": "Create a detailed plan for a project you’re working on.",
    "journal": "What foundational elements do I need to strengthen in my life?",
    "tags": [
      "foundation",
      "planning",
      "structure"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 287,
<<<<<<< Updated upstream
    "key": "Capricorn 18",
    "sign": "Capricorn",
    "degree": 18,
    "symbol": "Standard: A standards and stewardship moment is on the table.",
    "signal": "Quality needs definition. Emphasize build.",
    "shadow": "Vague standards create stress. Watch for overwork.",
    "directive": "Define the standard. Keep it standards and stewardship.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "focus",
      "build",
      "standard"
=======
    "key": "Capricorn_18",
    "sign": "Capricorn",
    "degree": 18,
    "symbol": "A tree standing tall in a forest.",
    "signal": "Stability amidst change.",
    "shadow": "Fear of instability and change.",
    "directive": "Embrace change as a natural part of life.",
    "practice": "Reflect on a recent change and identify its positive aspects.",
    "journal": "What changes am I resisting, and how can I shift my perspective?",
    "tags": [
      "stability",
      "change",
      "resilience"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 288,
<<<<<<< Updated upstream
    "key": "Capricorn 19",
    "sign": "Capricorn",
    "degree": 19,
    "symbol": "Tempo: A standards and stewardship moment is on the table.",
    "signal": "Timing matters. Emphasize build.",
    "shadow": "Forcing pace breaks form. Watch for overwork.",
    "directive": "Set the pace. Keep it standards and stewardship.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "focus",
      "tempo",
      "build"
=======
    "key": "Capricorn_19",
    "sign": "Capricorn",
    "degree": 19,
    "symbol": "A mountain climber reaches the peak.",
    "signal": "Achievement through perseverance.",
    "shadow": "Fear of failure or inadequacy.",
    "directive": "Embrace challenges as opportunities for growth.",
    "practice": "Set a small goal and take steps to achieve it, reflecting on your progress.",
    "journal": "What challenge have I been avoiding, and how can I approach it differently?",
    "tags": [
      "achievement",
      "growth",
      "challenge"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 289,
<<<<<<< Updated upstream
    "key": "Capricorn 20",
    "sign": "Capricorn",
    "degree": 20,
    "symbol": "Risk: A standards and stewardship moment is on the table.",
    "signal": "A calculated step is required. Emphasize build.",
    "shadow": "Impulse risk is not courage. Watch for overwork.",
    "directive": "Take a measured risk. Keep it standards and stewardship.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "focus",
      "build",
      "risk"
=======
    "key": "Capricorn_20",
    "sign": "Capricorn",
    "degree": 20,
    "symbol": "A group of people working together.",
    "signal": "Collaboration leads to success.",
    "shadow": "Struggles with teamwork or communication.",
    "directive": "Foster connections and share responsibilities.",
    "practice": "Engage in a team project, focusing on clear communication and shared goals.",
    "journal": "How do I contribute to group dynamics, and what can I improve?",
    "tags": [
      "collaboration",
      "teamwork",
      "communication"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 290,
<<<<<<< Updated upstream
    "key": "Capricorn 21",
    "sign": "Capricorn",
    "degree": 21,
    "symbol": "Integration: A standards and stewardship moment is on the table.",
    "signal": "Pieces want alignment. Emphasize build.",
    "shadow": "Fragmentation creates fatigue. Watch for overwork.",
    "directive": "Integrate. Keep it standards and stewardship.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "focus",
      "build"
=======
    "key": "Capricorn_21",
    "sign": "Capricorn",
    "degree": 21,
    "symbol": "An architect designing a building.",
    "signal": "Vision and planning are essential.",
    "shadow": "Overlooking details or rushing processes.",
    "directive": "Create a structured plan for your aspirations.",
    "practice": "Draft a blueprint for a personal or professional project, considering all aspects.",
    "journal": "What is my vision for the future, and what steps am I taking to realize it?",
    "tags": [
      "planning",
      "vision",
      "structure"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 291,
<<<<<<< Updated upstream
    "key": "Capricorn 22",
    "sign": "Capricorn",
    "degree": 22,
    "symbol": "Authority: A standards and stewardship moment is on the table.",
    "signal": "Own responsibility. Emphasize build.",
    "shadow": "Blame delays progress. Watch for overwork.",
    "directive": "Take ownership. Keep it standards and stewardship.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "focus",
      "authority",
      "build"
=======
    "key": "Capricorn_22",
    "sign": "Capricorn",
    "degree": 22,
    "symbol": "A wise elder sharing knowledge.",
    "signal": "Learning from experience and wisdom.",
    "shadow": "Resistance to advice or mentorship.",
    "directive": "Seek guidance from those with more experience.",
    "practice": "Identify a mentor or resource that can provide insight into your current challenges.",
    "journal": "Who can I turn to for wisdom, and what do I hope to learn from them?",
    "tags": [
      "wisdom",
      "mentorship",
      "learning"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 292,
<<<<<<< Updated upstream
    "key": "Capricorn 23",
    "sign": "Capricorn",
    "degree": 23,
    "symbol": "Refine: A standards and stewardship moment is on the table.",
    "signal": "Polish after completion. Emphasize build.",
    "shadow": "Editing before finishing stalls. Watch for overwork.",
    "directive": "Refine the finished draft. Keep it standards and stewardship.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "build",
      "focus"
=======
    "key": "Capricorn_23",
    "sign": "Capricorn",
    "degree": 23,
    "symbol": "A ship navigating through rough waters.",
    "signal": "Resilience in the face of adversity.",
    "shadow": "Feeling overwhelmed by challenges.",
    "directive": "Cultivate inner strength and adaptability.",
    "practice": "Reflect on past challenges and how you overcame them; apply those lessons now.",
    "journal": "What current obstacles feel insurmountable, and how can I navigate through them?",
    "tags": [
      "resilience",
      "adaptability",
      "strength"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 293,
<<<<<<< Updated upstream
    "key": "Capricorn 24",
    "sign": "Capricorn",
    "degree": 24,
    "symbol": "Stewardship: A standards and stewardship moment is on the table.",
    "signal": "Resources need care. Emphasize build.",
    "shadow": "Waste hides in habits. Watch for overwork.",
    "directive": "Protect resources. Keep it standards and stewardship.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "build",
      "stewardship"
=======
    "key": "Capricorn_24",
    "sign": "Capricorn",
    "degree": 24,
    "symbol": "A farmer tending to crops.",
    "signal": "Nurturing growth and patience.",
    "shadow": "Impatience or neglect of responsibilities.",
    "directive": "Invest time and effort into your long-term goals.",
    "practice": "Create a routine that supports your personal or professional development.",
    "journal": "What areas of my life require more nurturing and attention?",
    "tags": [
      "growth",
      "patience",
      "nurturing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 294,
<<<<<<< Updated upstream
    "key": "Capricorn 25",
    "sign": "Capricorn",
    "degree": 25,
    "symbol": "Signal-to-noise: A standards and stewardship moment is on the table.",
    "signal": "Simplify inputs. Emphasize build.",
    "shadow": "Overconsumption clouds judgment. Watch for overwork.",
    "directive": "Reduce intake. Keep it standards and stewardship.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "focus",
      "build"
=======
    "key": "Capricorn_25",
    "sign": "Capricorn",
    "degree": 25,
    "symbol": "A mountain range under a clear sky.",
    "signal": "Clarity and perspective in decision-making.",
    "shadow": "Confusion or lack of direction.",
    "directive": "Take time to gain clarity before making important decisions.",
    "practice": "Spend time in nature or a quiet space to reflect on your priorities.",
    "journal": "What decisions am I facing, and how can I ensure I have the right perspective?",
    "tags": [
      "clarity",
      "perspective",
      "decision-making"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 295,
<<<<<<< Updated upstream
    "key": "Capricorn 26",
    "sign": "Capricorn",
    "degree": 26,
    "symbol": "Sustain: A standards and stewardship moment is on the table.",
    "signal": "Make it last. Emphasize build.",
    "shadow": "Burnout follows spikes. Watch for overwork.",
    "directive": "Sustain. Keep it standards and stewardship.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "focus",
      "sustain",
      "build"
=======
    "key": "Capricorn_26",
    "sign": "Capricorn",
    "degree": 26,
    "symbol": "A businessperson making a deal.",
    "signal": "Negotiation and strategic thinking.",
    "shadow": "Fear of conflict or avoidance of confrontation.",
    "directive": "Engage in negotiations with confidence and integrity.",
    "practice": "Prepare for an upcoming discussion or negotiation by outlining your goals and boundaries.",
    "journal": "What negotiations do I need to engage in, and how can I approach them effectively?",
    "tags": [
      "negotiation",
      "strategy",
      "confidence"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 296,
<<<<<<< Updated upstream
    "key": "Capricorn 27",
    "sign": "Capricorn",
    "degree": 27,
    "symbol": "Legacy: A standards and stewardship moment is on the table.",
    "signal": "Long-term view matters. Emphasize build.",
    "shadow": "Short-term ego derails. Watch for overwork.",
    "directive": "Think long. Keep it standards and stewardship.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "build",
      "legacy",
      "stewardship"
=======
    "key": "Capricorn_27",
    "sign": "Capricorn",
    "degree": 27,
    "symbol": "A person climbing a steep hill.",
    "signal": "Determination and hard work pay off.",
    "shadow": "Burnout or exhaustion from overexertion.",
    "directive": "Balance ambition with self-care.",
    "practice": "Set aside time for rest and rejuvenation amidst your pursuits.",
    "journal": "Am I pushing myself too hard, and how can I find balance in my efforts?",
    "tags": [
      "determination",
      "balance",
      "self-care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 297,
<<<<<<< Updated upstream
    "key": "Capricorn 28",
    "sign": "Capricorn",
    "degree": 28,
    "symbol": "Closure: A standards and stewardship moment is on the table.",
    "signal": "Finish cycles. Emphasize build.",
    "shadow": "Open loops drain attention. Watch for overwork.",
    "directive": "Close the loop. Keep it standards and stewardship.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "build",
      "focus"
=======
    "key": "Capricorn_28",
    "sign": "Capricorn",
    "degree": 28,
    "symbol": "A lighthouse guiding ships.",
    "signal": "Providing guidance and support to others.",
    "shadow": "Neglecting your own needs while helping others.",
    "directive": "Be a source of support while also prioritizing your own well-being.",
    "practice": "Volunteer or mentor someone, but ensure you also carve out time for yourself.",
    "journal": "How can I support others while also taking care of my own needs?",
    "tags": [
      "guidance",
      "support",
      "well-being"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 298,
<<<<<<< Updated upstream
    "key": "Capricorn 29",
    "sign": "Capricorn",
    "degree": 29,
    "symbol": "Threshold: A standards and stewardship moment is on the table.",
    "signal": "A transition is near. Emphasize build.",
    "shadow": "Hesitation creates drift. Watch for overwork.",
    "directive": "Cross the threshold. Keep it standards and stewardship.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "focus",
      "build"
=======
    "key": "Capricorn_29",
    "sign": "Capricorn",
    "degree": 29,
    "symbol": "A mountain stream flowing.",
    "signal": "Adaptability and flow in life’s journey.",
    "shadow": "Resistance to change or rigidity.",
    "directive": "Embrace change and be open to new experiences.",
    "practice": "Try something new this week that pushes you out of your comfort zone.",
    "journal": "What changes am I resisting, and how can I approach them with an open mind?",
    "tags": [
      "adaptability",
      "change",
      "flow"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 299,
<<<<<<< Updated upstream
    "key": "Capricorn 30",
    "sign": "Capricorn",
    "degree": 30,
    "symbol": "Completion: A standards and stewardship moment is on the table.",
    "signal": "Harvest the result. Emphasize build.",
    "shadow": "Skipping review repeats mistakes. Watch for overwork.",
    "directive": "Complete and review. Keep it standards and stewardship.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "focus",
      "build",
      "completion"
=======
    "key": "Capricorn_30",
    "sign": "Capricorn",
    "degree": 30,
    "symbol": "A crow perched on a branch.",
    "signal": "Observation and insight.",
    "shadow": "Being overly critical or cynical.",
    "directive": "Practice mindfulness and observation without judgment.",
    "practice": "Spend a few minutes each day observing your surroundings without labeling or judging them.",
    "journal": "What insights can I gain from simply observing my environment?",
    "tags": [
      "observation",
      "mindfulness",
      "insight"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 300,
<<<<<<< Updated upstream
    "key": "Aquarius 1",
    "sign": "Aquarius",
    "degree": 1,
    "symbol": "Start: A shared structures moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize systemize.",
    "shadow": "Rushing creates rework. Watch for detachment.",
    "directive": "Start small and make it real. Keep it shared structures.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "focus",
      "start",
      "systemize"
=======
    "key": "Aquarius_1",
    "sign": "Aquarius",
    "degree": 1,
    "symbol": "A new dawn breaking over the horizon.",
    "signal": "Embrace innovation and fresh ideas.",
    "shadow": "Resisting change and clinging to the past.",
    "directive": "Seek out new perspectives and be open to unconventional solutions.",
    "practice": "Spend time brainstorming new approaches to a current challenge.",
    "journal": "What new idea have I been hesitant to explore, and why?",
    "tags": [
      "innovation",
      "change",
      "perspective"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 301,
<<<<<<< Updated upstream
    "key": "Aquarius 2",
    "sign": "Aquarius",
    "degree": 2,
    "symbol": "Choice: A shared structures moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize systemize.",
    "shadow": "Keeping both dilutes effort. Watch for detachment.",
    "directive": "Pick one lane and commit. Keep it shared structures.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "focus",
      "systemize"
=======
    "key": "Aquarius_2",
    "sign": "Aquarius",
    "degree": 2,
    "symbol": "A group of people collaborating on a project.",
    "signal": "The power of teamwork and collective effort.",
    "shadow": "Isolation and reluctance to engage with others.",
    "directive": "Foster collaboration by reaching out to others for input.",
    "practice": "Join a group or community that aligns with your interests.",
    "journal": "How can I better connect with others to achieve common goals?",
    "tags": [
      "collaboration",
      "community",
      "teamwork"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 302,
<<<<<<< Updated upstream
    "key": "Aquarius 3",
    "sign": "Aquarius",
    "degree": 3,
    "symbol": "Signal: A shared structures moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize systemize.",
    "shadow": "Noise hides the point. Watch for detachment.",
    "directive": "Name the signal and ignore the rest. Keep it shared structures.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "focus",
      "systemize",
      "signal"
=======
    "key": "Aquarius_3",
    "sign": "Aquarius",
    "degree": 3,
    "symbol": "A scientist conducting an experiment.",
    "signal": "Curiosity and the pursuit of knowledge.",
    "shadow": "Fear of failure and avoidance of experimentation.",
    "directive": "Approach problems with a mindset of inquiry and exploration.",
    "practice": "Conduct a small experiment related to a personal interest.",
    "journal": "What knowledge am I seeking, and what steps can I take to gain it?",
    "tags": [
      "curiosity",
      "knowledge",
      "experimentation"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 303,
<<<<<<< Updated upstream
    "key": "Aquarius 4",
    "sign": "Aquarius",
    "degree": 4,
    "symbol": "Structure: A shared structures moment is on the table.",
    "signal": "A stable frame is needed. Emphasize systemize.",
    "shadow": "Improvisation without a base collapses. Watch for detachment.",
    "directive": "Build the container first. Keep it shared structures.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "focus",
      "systemize",
      "structure"
=======
    "key": "Aquarius_4",
    "sign": "Aquarius",
    "degree": 4,
    "symbol": "A lighthouse guiding ships to safety.",
    "signal": "Providing guidance and support to others.",
    "shadow": "Neglecting to share your insights and experiences.",
    "directive": "Be a source of light for those navigating their own challenges.",
    "practice": "Mentor someone or share your knowledge with a peer.",
    "journal": "In what ways can I offer support to someone in need?",
    "tags": [
      "guidance",
      "support",
      "mentorship"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 304,
<<<<<<< Updated upstream
    "key": "Aquarius 5",
    "sign": "Aquarius",
    "degree": 5,
    "symbol": "Craft: A shared structures moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize systemize.",
    "shadow": "Overthinking delays practice. Watch for detachment.",
    "directive": "Practice the fundamentals. Keep it shared structures.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "focus",
      "systemize"
=======
    "key": "Aquarius_5",
    "sign": "Aquarius",
    "degree": 5,
    "symbol": "A vibrant marketplace filled with diverse goods.",
    "signal": "Celebrating diversity and abundance.",
    "shadow": "Narrow-mindedness and overlooking the value of variety.",
    "directive": "Embrace different perspectives and experiences in your life.",
    "practice": "Try something new that exposes you to a different culture or idea.",
    "journal": "What diversity in my life can I appreciate more fully?",
    "tags": [
      "diversity",
      "abundance",
      "variety"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 305,
<<<<<<< Updated upstream
    "key": "Aquarius 6",
    "sign": "Aquarius",
    "degree": 6,
    "symbol": "Order: A shared structures moment is on the table.",
    "signal": "Details want sorting. Emphasize systemize.",
    "shadow": "Perfectionism blocks delivery. Watch for detachment.",
    "directive": "Organize, then ship. Keep it shared structures.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "focus",
      "systemize",
      "order"
=======
    "key": "Aquarius_6",
    "sign": "Aquarius",
    "degree": 6,
    "symbol": "A community gathering to celebrate a festival.",
    "signal": "The importance of community and shared joy.",
    "shadow": "Withdrawing from social connections and festivities.",
    "directive": "Engage with your community and participate in local events.",
    "practice": "Attend a community event or organize a gathering.",
    "journal": "What role does community play in my happiness?",
    "tags": [
      "community",
      "celebration",
      "joy"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 306,
<<<<<<< Updated upstream
    "key": "Aquarius 7",
    "sign": "Aquarius",
    "degree": 7,
    "symbol": "Terms: A shared structures moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize systemize.",
    "shadow": "Avoiding terms breeds friction. Watch for detachment.",
    "directive": "State expectations plainly. Keep it shared structures.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "focus",
      "systemize",
      "terms"
=======
    "key": "Aquarius_7",
    "sign": "Aquarius",
    "degree": 7,
    "symbol": "A visionary artist creating a masterpiece.",
    "signal": "Harnessing creativity to express unique visions.",
    "shadow": "Stifling creativity due to self-doubt or fear of judgment.",
    "directive": "Allow your creativity to flow without constraints.",
    "practice": "Engage in a creative activity without worrying about the outcome.",
    "journal": "What creative expression have I been avoiding, and why?",
    "tags": [
      "creativity",
      "expression",
      "vision"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 307,
<<<<<<< Updated upstream
    "key": "Aquarius 8",
    "sign": "Aquarius",
    "degree": 8,
    "symbol": "Depth: A shared structures moment is on the table.",
    "signal": "A hidden factor matters. Emphasize systemize.",
    "shadow": "Control replaces honesty. Watch for detachment.",
    "directive": "Confront the real issue. Keep it shared structures.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "focus",
      "depth",
      "systemize"
=======
    "key": "Aquarius_8",
    "sign": "Aquarius",
    "degree": 8,
    "symbol": "A tree with deep roots and broad branches.",
    "signal": "Stability and growth in personal and professional life.",
    "shadow": "Instability and fear of commitment.",
    "directive": "Nurture your foundations while reaching for new heights.",
    "practice": "Identify areas of your life that need strengthening and take action.",
    "journal": "What roots do I need to strengthen to support my growth?",
    "tags": [
      "stability",
      "growth",
      "commitment"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 308,
<<<<<<< Updated upstream
    "key": "Aquarius 9",
    "sign": "Aquarius",
    "degree": 9,
    "symbol": "Aim: A shared structures moment is on the table.",
    "signal": "A goal needs meaning. Emphasize systemize.",
    "shadow": "Drift wastes time. Watch for detachment.",
    "directive": "Choose direction. Keep it shared structures.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "systemize",
      "focus"
=======
    "key": "Aquarius_9",
    "sign": "Aquarius",
    "degree": 9,
    "symbol": "An inventor unveiling a new device.",
    "signal": "Innovation and the excitement of new ideas.",
    "shadow": "Fear of failure and reluctance to share innovations.",
    "directive": "Share your ideas and innovations with others for feedback.",
    "practice": "Draft a proposal or presentation for a new idea you have.",
    "journal": "What innovative idea am I excited about, and how can I share it?",
    "tags": [
      "innovation",
      "ideas",
      "feedback"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 309,
<<<<<<< Updated upstream
    "key": "Aquarius 10",
    "sign": "Aquarius",
    "degree": 10,
    "symbol": "Ledger: A shared structures moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize systemize.",
    "shadow": "Self-worth ties to output. Watch for detachment.",
    "directive": "Measure and adjust. Keep it shared structures.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "ledger",
      "stewardship",
      "systemize"
=======
    "key": "Aquarius_10",
    "sign": "Aquarius",
    "degree": 10,
    "symbol": "A bridge connecting two communities.",
    "signal": "Building connections and fostering understanding.",
    "shadow": "Creating divisions and misunderstandings.",
    "directive": "Act as a bridge between differing viewpoints or groups.",
    "practice": "Facilitate a discussion between people with differing opinions.",
    "journal": "How can I help bridge gaps between people in my life?",
    "tags": [
      "connection",
      "understanding",
      "community"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 310,
<<<<<<< Updated upstream
    "key": "Aquarius 11",
    "sign": "Aquarius",
    "degree": 11,
    "symbol": "Network: A shared structures moment is on the table.",
    "signal": "Support systems matter. Emphasize systemize.",
    "shadow": "Isolation becomes a habit. Watch for detachment.",
    "directive": "Share the plan. Keep it shared structures.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "focus",
      "systemize",
      "network"
=======
    "key": "Aquarius_11",
    "sign": "Aquarius",
    "degree": 11,
    "symbol": "A starry sky filled with possibilities.",
    "signal": "Endless potential and dreaming big.",
    "shadow": "Limiting beliefs that stifle ambition.",
    "directive": "Expand your vision and set ambitious goals.",
    "practice": "Create a vision board that reflects your dreams and aspirations.",
    "journal": "What dreams have I been too afraid to pursue?",
    "tags": [
      "potential",
      "dreams",
      "ambition"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 311,
<<<<<<< Updated upstream
    "key": "Aquarius 12",
    "sign": "Aquarius",
    "degree": 12,
    "symbol": "Reset: A shared structures moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize systemize.",
    "shadow": "Escaping replaces rest. Watch for detachment.",
    "directive": "Pause and return with intent. Keep it shared structures.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "focus",
      "systemize",
      "reset"
=======
    "key": "Aquarius_12",
    "sign": "Aquarius",
    "degree": 12,
    "symbol": "A wise elder sharing knowledge.",
    "signal": "The value of wisdom and experience.",
    "shadow": "Ignoring the lessons of the past.",
    "directive": "Reflect on your experiences and share your insights with others.",
    "practice": "Write down key lessons you've learned and how they can help others.",
    "journal": "What wisdom have I gained that I can share with someone today?",
    "tags": [
      "wisdom",
      "experience",
      "sharing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 312,
<<<<<<< Updated upstream
    "key": "Aquarius 13",
    "sign": "Aquarius",
    "degree": 13,
    "symbol": "Commit: A shared structures moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize systemize.",
    "shadow": "Half-commitment drains energy. Watch for detachment.",
    "directive": "Commit fully. Keep it shared structures.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "focus",
      "commit",
      "systemize"
=======
    "key": "Aquarius_13",
    "sign": "Aquarius",
    "degree": 13,
    "symbol": "A group of people gathered around a campfire.",
    "signal": "Community bonding and shared experiences.",
    "shadow": "Isolation and disconnection from others.",
    "directive": "Engage with your community; seek out shared interests.",
    "practice": "Organize or participate in a group activity that fosters connection.",
    "journal": "What steps can I take to strengthen my ties with my community?",
    "tags": [
      "community",
      "connection",
      "group activity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 313,
<<<<<<< Updated upstream
    "key": "Aquarius 14",
    "sign": "Aquarius",
    "degree": 14,
    "symbol": "Boundaries: A shared structures moment is on the table.",
    "signal": "Limits protect value. Emphasize systemize.",
    "shadow": "Saying yes too fast costs you. Watch for detachment.",
    "directive": "Set a boundary. Keep it shared structures.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "focus",
      "systemize"
=======
    "key": "Aquarius_14",
    "sign": "Aquarius",
    "degree": 14,
    "symbol": "A scientist conducting an experiment.",
    "signal": "Innovation through exploration and experimentation.",
    "shadow": "Fear of failure and reluctance to try new methods.",
    "directive": "Embrace curiosity; allow yourself to experiment without fear.",
    "practice": "Try a new approach to a problem you've been facing.",
    "journal": "What new ideas can I explore to solve my current challenges?",
    "tags": [
      "innovation",
      "experimentation",
      "curiosity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 314,
<<<<<<< Updated upstream
    "key": "Aquarius 15",
    "sign": "Aquarius",
    "degree": 15,
    "symbol": "Mirror: A shared structures moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize systemize.",
    "shadow": "Defensiveness blocks learning. Watch for detachment.",
    "directive": "Take the note. Keep it shared structures.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "systemize",
      "focus"
=======
    "key": "Aquarius_15",
    "sign": "Aquarius",
    "degree": 15,
    "symbol": "A person reading a book in a library.",
    "signal": "The pursuit of knowledge and wisdom.",
    "shadow": "Intellectual stagnation and avoidance of learning.",
    "directive": "Dedicate time to learning; seek knowledge actively.",
    "practice": "Read a book or take a course on a subject of interest.",
    "journal": "What knowledge do I wish to acquire, and why?",
    "tags": [
      "knowledge",
      "learning",
      "wisdom"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 315,
<<<<<<< Updated upstream
    "key": "Aquarius 16",
    "sign": "Aquarius",
    "degree": 16,
    "symbol": "Repair: A shared structures moment is on the table.",
    "signal": "Something wants fixing. Emphasize systemize.",
    "shadow": "Avoidance compounds cost. Watch for detachment.",
    "directive": "Repair it. Keep it shared structures.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "focus",
      "systemize",
      "repair"
=======
    "key": "Aquarius_16",
    "sign": "Aquarius",
    "degree": 16,
    "symbol": "A futuristic cityscape.",
    "signal": "Vision and forward-thinking.",
    "shadow": "Being stuck in outdated beliefs and practices.",
    "directive": "Envision your future; set goals that reflect your aspirations.",
    "practice": "Create a vision board to visualize your future goals.",
    "journal": "What does my ideal future look like, and what steps can I take to get there?",
    "tags": [
      "vision",
      "future",
      "goals"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 316,
<<<<<<< Updated upstream
    "key": "Aquarius 17",
    "sign": "Aquarius",
    "degree": 17,
    "symbol": "Focus: A shared structures moment is on the table.",
    "signal": "Attention is currency. Emphasize systemize.",
    "shadow": "Multitasking reduces quality. Watch for detachment.",
    "directive": "Single-task. Keep it shared structures.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "systemize"
=======
    "key": "Aquarius_17",
    "sign": "Aquarius",
    "degree": 17,
    "symbol": "A person planting a tree.",
    "signal": "Growth and long-term commitment.",
    "shadow": "Neglecting responsibilities and short-term thinking.",
    "directive": "Invest in your future; think long-term in your decisions.",
    "practice": "Start a project that requires ongoing effort and dedication.",
    "journal": "What long-term goals am I willing to commit to right now?",
    "tags": [
      "growth",
      "commitment",
      "long-term"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 317,
<<<<<<< Updated upstream
    "key": "Aquarius 18",
    "sign": "Aquarius",
    "degree": 18,
    "symbol": "Standard: A shared structures moment is on the table.",
    "signal": "Quality needs definition. Emphasize systemize.",
    "shadow": "Vague standards create stress. Watch for detachment.",
    "directive": "Define the standard. Keep it shared structures.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "focus",
      "systemize",
      "standard"
=======
    "key": "Aquarius_18",
    "sign": "Aquarius",
    "degree": 18,
    "symbol": "A group of friends laughing together.",
    "signal": "Joy in companionship and shared moments.",
    "shadow": "Taking relationships for granted and lack of appreciation.",
    "directive": "Celebrate your friendships; express gratitude to those you care about.",
    "practice": "Plan a fun gathering with friends to strengthen bonds.",
    "journal": "Who in my life deserves my appreciation, and how can I express it?",
    "tags": [
      "friendship",
      "joy",
      "gratitude"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 318,
<<<<<<< Updated upstream
    "key": "Aquarius 19",
    "sign": "Aquarius",
    "degree": 19,
    "symbol": "Tempo: A shared structures moment is on the table.",
    "signal": "Timing matters. Emphasize systemize.",
    "shadow": "Forcing pace breaks form. Watch for detachment.",
    "directive": "Set the pace. Keep it shared structures.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "focus",
      "tempo",
      "systemize"
=======
    "key": "Aquarius_19",
    "sign": "Aquarius",
    "degree": 19,
    "symbol": "An artist painting a mural.",
    "signal": "Creativity and self-expression.",
    "shadow": "Fear of judgment and suppressing artistic impulses.",
    "directive": "Allow your creativity to flow; express yourself freely.",
    "practice": "Engage in a creative activity that excites you, regardless of skill level.",
    "journal": "What creative expression have I been avoiding, and why?",
    "tags": [
      "creativity",
      "self-expression",
      "art"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 319,
<<<<<<< Updated upstream
    "key": "Aquarius 20",
    "sign": "Aquarius",
    "degree": 20,
    "symbol": "Risk: A shared structures moment is on the table.",
    "signal": "A calculated step is required. Emphasize systemize.",
    "shadow": "Impulse risk is not courage. Watch for detachment.",
    "directive": "Take a measured risk. Keep it shared structures.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "focus",
      "systemize",
      "risk"
=======
    "key": "Aquarius_20",
    "sign": "Aquarius",
    "degree": 20,
    "symbol": "A lighthouse guiding ships.",
    "signal": "Leadership and guidance for others.",
    "shadow": "Avoiding responsibility and shying away from leadership roles.",
    "directive": "Step into a leadership role; offer guidance to those in need.",
    "practice": "Mentor someone or take charge of a group project.",
    "journal": "In what ways can I step up and lead in my community or workplace?",
    "tags": [
      "leadership",
      "guidance",
      "responsibility"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 320,
<<<<<<< Updated upstream
    "key": "Aquarius 21",
    "sign": "Aquarius",
    "degree": 21,
    "symbol": "Integration: A shared structures moment is on the table.",
    "signal": "Pieces want alignment. Emphasize systemize.",
    "shadow": "Fragmentation creates fatigue. Watch for detachment.",
    "directive": "Integrate. Keep it shared structures.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "focus",
      "systemize"
=======
    "key": "Aquarius_21",
    "sign": "Aquarius",
    "degree": 21,
    "symbol": "A group of people celebrating a festival.",
    "signal": "Unity and collective joy.",
    "shadow": "Isolation and missing out on collective experiences.",
    "directive": "Join in celebrations; participate in community events.",
    "practice": "Attend a local event or festival to connect with others.",
    "journal": "What community events can I participate in to foster connection?",
    "tags": [
      "celebration",
      "community",
      "unity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 321,
<<<<<<< Updated upstream
    "key": "Aquarius 22",
    "sign": "Aquarius",
    "degree": 22,
    "symbol": "Authority: A shared structures moment is on the table.",
    "signal": "Own responsibility. Emphasize systemize.",
    "shadow": "Blame delays progress. Watch for detachment.",
    "directive": "Take ownership. Keep it shared structures.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "focus",
      "authority",
      "systemize"
=======
    "key": "Aquarius_22",
    "sign": "Aquarius",
    "degree": 22,
    "symbol": "A person navigating a maze.",
    "signal": "Problem-solving and finding one's way.",
    "shadow": "Feeling lost or overwhelmed by obstacles.",
    "directive": "Tackle challenges head-on; seek solutions with determination.",
    "practice": "Identify a current challenge and outline actionable steps to overcome it.",
    "journal": "What obstacles am I facing, and what strategies can I employ to navigate them?",
    "tags": [
      "problem-solving",
      "challenges",
      "determination"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 322,
<<<<<<< Updated upstream
    "key": "Aquarius 23",
    "sign": "Aquarius",
    "degree": 23,
    "symbol": "Refine: A shared structures moment is on the table.",
    "signal": "Polish after completion. Emphasize systemize.",
    "shadow": "Editing before finishing stalls. Watch for detachment.",
    "directive": "Refine the finished draft. Keep it shared structures.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "systemize",
      "focus"
=======
    "key": "Aquarius_23",
    "sign": "Aquarius",
    "degree": 23,
    "symbol": "A person gazing at the stars.",
    "signal": "Dreaming big and reaching for aspirations.",
    "shadow": "Limiting beliefs and fear of aiming high.",
    "directive": "Expand your horizons; dare to dream without limits.",
    "practice": "Write down your biggest dreams and the steps to achieve them.",
    "journal": "What dreams have I been hesitant to pursue, and why?",
    "tags": [
      "dreams",
      "aspirations",
      "limitless"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 323,
<<<<<<< Updated upstream
    "key": "Aquarius 24",
    "sign": "Aquarius",
    "degree": 24,
    "symbol": "Stewardship: A shared structures moment is on the table.",
    "signal": "Resources need care. Emphasize systemize.",
    "shadow": "Waste hides in habits. Watch for detachment.",
    "directive": "Protect resources. Keep it shared structures.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "systemize",
      "stewardship"
=======
    "key": "Aquarius_24",
    "sign": "Aquarius",
    "degree": 24,
    "symbol": "A person giving a speech.",
    "signal": "Communication and sharing ideas.",
    "shadow": "Fear of public speaking and holding back opinions.",
    "directive": "Share your voice; communicate your ideas confidently.",
    "practice": "Practice speaking in front of a group or write an article to share your thoughts.",
    "journal": "What message do I feel compelled to share, and what holds me back?",
    "tags": [
      "communication",
      "expression",
      "confidence"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 324,
<<<<<<< Updated upstream
    "key": "Aquarius 25",
    "sign": "Aquarius",
    "degree": 25,
    "symbol": "Signal-to-noise: A shared structures moment is on the table.",
    "signal": "Simplify inputs. Emphasize systemize.",
    "shadow": "Overconsumption clouds judgment. Watch for detachment.",
    "directive": "Reduce intake. Keep it shared structures.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "focus",
      "systemize"
=======
    "key": "Aquarius_25",
    "sign": "Aquarius",
    "degree": 25,
    "symbol": "A group of people gathered around a campfire.",
    "signal": "Community and shared experiences are emphasized.",
    "shadow": "Risk of isolation or feeling disconnected from others.",
    "directive": "Engage with your community and share your ideas.",
    "practice": "Host a gathering to discuss common interests.",
    "journal": "What connections do I need to nurture in my life?",
    "tags": [
      "community",
      "connection",
      "sharing"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 325,
<<<<<<< Updated upstream
    "key": "Aquarius 26",
    "sign": "Aquarius",
    "degree": 26,
    "symbol": "Sustain: A shared structures moment is on the table.",
    "signal": "Make it last. Emphasize systemize.",
    "shadow": "Burnout follows spikes. Watch for detachment.",
    "directive": "Sustain. Keep it shared structures.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "focus",
      "sustain",
      "systemize"
=======
    "key": "Aquarius_26",
    "sign": "Aquarius",
    "degree": 26,
    "symbol": "A man in a futuristic city.",
    "signal": "Innovation and forward-thinking are highlighted.",
    "shadow": "Avoid becoming too detached from reality.",
    "directive": "Embrace new technologies and ideas.",
    "practice": "Spend time researching a new trend or technology.",
    "journal": "How can I integrate innovation into my daily life?",
    "tags": [
      "innovation",
      "technology",
      "future"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 326,
<<<<<<< Updated upstream
    "key": "Aquarius 27",
    "sign": "Aquarius",
    "degree": 27,
    "symbol": "Legacy: A shared structures moment is on the table.",
    "signal": "Long-term view matters. Emphasize systemize.",
    "shadow": "Short-term ego derails. Watch for detachment.",
    "directive": "Think long. Keep it shared structures.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "systemize",
      "legacy",
      "stewardship"
=======
    "key": "Aquarius_27",
    "sign": "Aquarius",
    "degree": 27,
    "symbol": "A scientist experimenting in a lab.",
    "signal": "The pursuit of knowledge is paramount.",
    "shadow": "Beware of over-analyzing and losing sight of the bigger picture.",
    "directive": "Seek out new learning opportunities.",
    "practice": "Enroll in a course or workshop that interests you.",
    "journal": "What knowledge do I wish to acquire next?",
    "tags": [
      "learning",
      "knowledge",
      "science"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 327,
<<<<<<< Updated upstream
    "key": "Aquarius 28",
    "sign": "Aquarius",
    "degree": 28,
    "symbol": "Closure: A shared structures moment is on the table.",
    "signal": "Finish cycles. Emphasize systemize.",
    "shadow": "Open loops drain attention. Watch for detachment.",
    "directive": "Close the loop. Keep it shared structures.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "systemize",
      "focus"
=======
    "key": "Aquarius_28",
    "sign": "Aquarius",
    "degree": 28,
    "symbol": "An artist painting a mural.",
    "signal": "Creativity and self-expression are key themes.",
    "shadow": "Avoid conforming to others' expectations.",
    "directive": "Express your individuality through art or creativity.",
    "practice": "Create something that reflects your personal vision.",
    "journal": "What does my creative expression reveal about me?",
    "tags": [
      "creativity",
      "art",
      "self-expression"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 328,
<<<<<<< Updated upstream
    "key": "Aquarius 29",
    "sign": "Aquarius",
    "degree": 29,
    "symbol": "Threshold: A shared structures moment is on the table.",
    "signal": "A transition is near. Emphasize systemize.",
    "shadow": "Hesitation creates drift. Watch for detachment.",
    "directive": "Cross the threshold. Keep it shared structures.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "focus",
      "systemize"
=======
    "key": "Aquarius_29",
    "sign": "Aquarius",
    "degree": 29,
    "symbol": "A group of friends enjoying a picnic.",
    "signal": "Joy in companionship and shared moments.",
    "shadow": "Risk of neglecting personal needs for social approval.",
    "directive": "Prioritize quality time with loved ones.",
    "practice": "Plan a social outing that fosters connection.",
    "journal": "How do my friendships enrich my life?",
    "tags": [
      "friendship",
      "joy",
      "social"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 329,
<<<<<<< Updated upstream
    "key": "Aquarius 30",
    "sign": "Aquarius",
    "degree": 30,
    "symbol": "Completion: A shared structures moment is on the table.",
    "signal": "Harvest the result. Emphasize systemize.",
    "shadow": "Skipping review repeats mistakes. Watch for detachment.",
    "directive": "Complete and review. Keep it shared structures.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "focus",
      "systemize",
      "completion"
=======
    "key": "Aquarius_30",
    "sign": "Aquarius",
    "degree": 30,
    "symbol": "A visionary contemplating the stars.",
    "signal": "Dreams and aspirations take center stage.",
    "shadow": "Beware of becoming lost in fantasy without action.",
    "directive": "Set clear goals based on your visions.",
    "practice": "Create a vision board to visualize your dreams.",
    "journal": "What dreams am I ready to pursue actively?",
    "tags": [
      "vision",
      "aspiration",
      "goals"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 330,
<<<<<<< Updated upstream
    "key": "Pisces 1",
    "sign": "Pisces",
    "degree": 1,
    "symbol": "Start: A quiet and intuition moment is on the table.",
    "signal": "Initiate with a clean first move. Emphasize reset.",
    "shadow": "Rushing creates rework. Watch for drift.",
    "directive": "Start small and make it real. Keep it quiet and intuition.",
    "practice": "Do the first 15-minute step.",
    "journal": "What is the smallest honest start I can make?",
    "tags": [
      "focus",
      "start",
      "reset"
=======
    "key": "Pisces_1",
    "sign": "Pisces",
    "degree": 1,
    "symbol": "A serene ocean at dawn.",
    "signal": "New beginnings and emotional clarity are present.",
    "shadow": "Risk of feeling overwhelmed by emotions.",
    "directive": "Embrace your feelings and intuition.",
    "practice": "Spend time in meditation or reflection by water.",
    "journal": "What emotions are guiding my current path?",
    "tags": [
      "emotion",
      "intuition",
      "new beginnings"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 331,
<<<<<<< Updated upstream
    "key": "Pisces 2",
    "sign": "Pisces",
    "degree": 2,
    "symbol": "Choice: A quiet and intuition moment is on the table.",
    "signal": "Two options require a clear selection. Emphasize reset.",
    "shadow": "Keeping both dilutes effort. Watch for drift.",
    "directive": "Pick one lane and commit. Keep it quiet and intuition.",
    "practice": "Write the decision and one reason.",
    "journal": "What decision am I avoiding?",
    "tags": [
      "choice",
      "focus",
      "reset"
=======
    "key": "Pisces_2",
    "sign": "Pisces",
    "degree": 2,
    "symbol": "A fish swimming upstream.",
    "signal": "Resilience and determination are highlighted.",
    "shadow": "Avoid resistance to change that could be beneficial.",
    "directive": "Face challenges with courage and adaptability.",
    "practice": "Identify an area where you can embrace change.",
    "journal": "What challenges am I currently facing, and how can I navigate them?",
    "tags": [
      "resilience",
      "determination",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 332,
<<<<<<< Updated upstream
    "key": "Pisces 3",
    "sign": "Pisces",
    "degree": 3,
    "symbol": "Signal: A quiet and intuition moment is on the table.",
    "signal": "A pattern becomes visible. Emphasize reset.",
    "shadow": "Noise hides the point. Watch for drift.",
    "directive": "Name the signal and ignore the rest. Keep it quiet and intuition.",
    "practice": "List 3 facts; delete 1 distraction.",
    "journal": "What is the simplest true pattern here?",
    "tags": [
      "focus",
      "reset",
      "signal"
=======
    "key": "Pisces_3",
    "sign": "Pisces",
    "degree": 3,
    "symbol": "A dreamer lost in thought.",
    "signal": "Imagination and creativity flow freely.",
    "shadow": "Beware of becoming too detached from reality.",
    "directive": "Channel your dreams into tangible projects.",
    "practice": "Write down your dreams and brainstorm ways to manifest them.",
    "journal": "What dreams inspire me to take action?",
    "tags": [
      "imagination",
      "creativity",
      "dreams"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 333,
<<<<<<< Updated upstream
    "key": "Pisces 4",
    "sign": "Pisces",
    "degree": 4,
    "symbol": "Structure: A quiet and intuition moment is on the table.",
    "signal": "A stable frame is needed. Emphasize reset.",
    "shadow": "Improvisation without a base collapses. Watch for drift.",
    "directive": "Build the container first. Keep it quiet and intuition.",
    "practice": "Set a time block and boundary.",
    "journal": "What structure protects my progress?",
    "tags": [
      "reset",
      "focus",
      "structure"
=======
    "key": "Pisces_4",
    "sign": "Pisces",
    "degree": 4,
    "symbol": "A healer tending to a patient.",
    "signal": "Compassion and care for others are emphasized.",
    "shadow": "Risk of neglecting your own needs while helping others.",
    "directive": "Practice self-care while supporting those around you.",
    "practice": "Engage in an act of kindness towards yourself and others.",
    "journal": "How can I balance caring for others with my own needs?",
    "tags": [
      "compassion",
      "healing",
      "self-care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 334,
<<<<<<< Updated upstream
    "key": "Pisces 5",
    "sign": "Pisces",
    "degree": 5,
    "symbol": "Craft: A quiet and intuition moment is on the table.",
    "signal": "Skill grows through repetition. Emphasize reset.",
    "shadow": "Overthinking delays practice. Watch for drift.",
    "directive": "Practice the fundamentals. Keep it quiet and intuition.",
    "practice": "Repeat one drill 20 minutes.",
    "journal": "What skill am I willing to train daily?",
    "tags": [
      "craft",
      "focus",
      "reset"
=======
    "key": "Pisces_5",
    "sign": "Pisces",
    "degree": 5,
    "symbol": "A musician playing a soulful melody.",
    "signal": "Artistic expression brings healing and connection.",
    "shadow": "Avoid using creativity as an escape from reality.",
    "directive": "Use art to process your emotions and experiences.",
    "practice": "Create music or art that reflects your inner feelings.",
    "journal": "What emotions do I wish to express through my creativity?",
    "tags": [
      "art",
      "music",
      "expression"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 335,
<<<<<<< Updated upstream
    "key": "Pisces 6",
    "sign": "Pisces",
    "degree": 6,
    "symbol": "Order: A quiet and intuition moment is on the table.",
    "signal": "Details want sorting. Emphasize reset.",
    "shadow": "Perfectionism blocks delivery. Watch for drift.",
    "directive": "Organize, then ship. Keep it quiet and intuition.",
    "practice": "Tidy one area; finish one task.",
    "journal": "What is 'good enough' today?",
    "tags": [
      "focus",
      "order",
      "reset"
=======
    "key": "Pisces_6",
    "sign": "Pisces",
    "degree": 6,
    "symbol": "A boat sailing into the horizon.",
    "signal": "Exploration and adventure are calling.",
    "shadow": "Beware of aimlessness without direction.",
    "directive": "Set intentions for your next adventure or journey.",
    "practice": "Plan a trip or explore a new interest.",
    "journal": "What new experiences am I ready to embrace?",
    "tags": [
      "exploration",
      "adventure",
      "journey"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 336,
<<<<<<< Updated upstream
    "key": "Pisces 7",
    "sign": "Pisces",
    "degree": 7,
    "symbol": "Terms: A quiet and intuition moment is on the table.",
    "signal": "A partnership requires clarity. Emphasize reset.",
    "shadow": "Avoiding terms breeds friction. Watch for drift.",
    "directive": "State expectations plainly. Keep it quiet and intuition.",
    "practice": "Write terms: do / don\u2019t / by when.",
    "journal": "What agreement needs updating?",
    "tags": [
      "focus",
      "terms",
      "reset"
=======
    "key": "Pisces_7",
    "sign": "Pisces",
    "degree": 7,
    "symbol": "A woman and her child are seen.",
    "signal": "Nurturing relationships and emotional bonds.",
    "shadow": "Over-dependence on others for emotional fulfillment.",
    "directive": "Cultivate a supportive environment for both yourself and those you care for.",
    "practice": "Spend quality time with loved ones, engaging in activities that strengthen your connection.",
    "journal": "How do my relationships reflect my own emotional needs?",
    "tags": [
      "relationships",
      "nurturing",
      "emotional"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 337,
<<<<<<< Updated upstream
    "key": "Pisces 8",
    "sign": "Pisces",
    "degree": 8,
    "symbol": "Depth: A quiet and intuition moment is on the table.",
    "signal": "A hidden factor matters. Emphasize reset.",
    "shadow": "Control replaces honesty. Watch for drift.",
    "directive": "Confront the real issue. Keep it quiet and intuition.",
    "practice": "Name the fear; take one direct action.",
    "journal": "What truth am I delaying?",
    "tags": [
      "focus",
      "depth",
      "reset"
=======
    "key": "Pisces_8",
    "sign": "Pisces",
    "degree": 8,
    "symbol": "A group of people are gathered around a campfire.",
    "signal": "Community and shared experiences.",
    "shadow": "Isolation from collective support and understanding.",
    "directive": "Engage with your community and share your experiences.",
    "practice": "Join a local group or participate in a community event.",
    "journal": "In what ways do I contribute to my community?",
    "tags": [
      "community",
      "connection",
      "shared experiences"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 338,
<<<<<<< Updated upstream
    "key": "Pisces 9",
    "sign": "Pisces",
    "degree": 9,
    "symbol": "Aim: A quiet and intuition moment is on the table.",
    "signal": "A goal needs meaning. Emphasize reset.",
    "shadow": "Drift wastes time. Watch for drift.",
    "directive": "Choose direction. Keep it quiet and intuition.",
    "practice": "Set one measurable target for today.",
    "journal": "Where am I going\u2014specifically?",
    "tags": [
      "aim",
      "focus",
      "reset"
=======
    "key": "Pisces_9",
    "sign": "Pisces",
    "degree": 9,
    "symbol": "A ship sailing in the distance.",
    "signal": "Exploration and the pursuit of new horizons.",
    "shadow": "Fear of venturing into the unknown.",
    "directive": "Embrace new opportunities for growth and exploration.",
    "practice": "Plan a small trip or explore a new hobby that excites you.",
    "journal": "What fears hold me back from pursuing new experiences?",
    "tags": [
      "exploration",
      "growth",
      "opportunity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 339,
<<<<<<< Updated upstream
    "key": "Pisces 10",
    "sign": "Pisces",
    "degree": 10,
    "symbol": "Ledger: A quiet and intuition moment is on the table.",
    "signal": "Accountability sharpens priorities. Emphasize reset.",
    "shadow": "Self-worth ties to output. Watch for drift.",
    "directive": "Measure and adjust. Keep it quiet and intuition.",
    "practice": "Review time/money; make one change.",
    "journal": "What would I do if I tracked this daily?",
    "tags": [
      "stewardship",
      "ledger",
      "reset"
=======
    "key": "Pisces_10",
    "sign": "Pisces",
    "degree": 10,
    "symbol": "A musician playing a violin.",
    "signal": "Creativity and self-expression.",
    "shadow": "Suppressing your creative impulses.",
    "directive": "Allow yourself to express your creativity freely.",
    "practice": "Engage in a creative activity that you enjoy, whether it's music, art, or writing.",
    "journal": "How do I express my creativity in my daily life?",
    "tags": [
      "creativity",
      "self-expression",
      "art"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 340,
<<<<<<< Updated upstream
    "key": "Pisces 11",
    "sign": "Pisces",
    "degree": 11,
    "symbol": "Network: A quiet and intuition moment is on the table.",
    "signal": "Support systems matter. Emphasize reset.",
    "shadow": "Isolation becomes a habit. Watch for drift.",
    "directive": "Share the plan. Keep it quiet and intuition.",
    "practice": "Send one clear update to someone.",
    "journal": "Who should know what I\u2019m building?",
    "tags": [
      "focus",
      "reset",
      "network"
=======
    "key": "Pisces_11",
    "sign": "Pisces",
    "degree": 11,
    "symbol": "A large, colorful fish swimming in clear water.",
    "signal": "Clarity and abundance in emotional expression.",
    "shadow": "Confusion or murkiness in feelings and intentions.",
    "directive": "Seek clarity in your emotional landscape and communicate openly.",
    "practice": "Write down your feelings and thoughts to gain clarity.",
    "journal": "What emotions am I currently avoiding or not expressing?",
    "tags": [
      "clarity",
      "emotions",
      "communication"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 341,
<<<<<<< Updated upstream
    "key": "Pisces 12",
    "sign": "Pisces",
    "degree": 12,
    "symbol": "Reset: A quiet and intuition moment is on the table.",
    "signal": "Clarity comes after quiet. Emphasize reset.",
    "shadow": "Escaping replaces rest. Watch for drift.",
    "directive": "Pause and return with intent. Keep it quiet and intuition.",
    "practice": "10 minutes offline; write next action.",
    "journal": "What becomes clear when I slow down?",
    "tags": [
      "focus",
      "reset"
=======
    "key": "Pisces_12",
    "sign": "Pisces",
    "degree": 12,
    "symbol": "A dreamer gazing at the stars.",
    "signal": "Vision and aspiration.",
    "shadow": "Getting lost in dreams without taking action.",
    "directive": "Balance your dreams with practical steps towards achieving them.",
    "practice": "Set realistic goals based on your aspirations and outline steps to reach them.",
    "journal": "What dreams am I passionate about, and what steps can I take to pursue them?",
    "tags": [
      "vision",
      "aspiration",
      "goals"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 342,
<<<<<<< Updated upstream
    "key": "Pisces 13",
    "sign": "Pisces",
    "degree": 13,
    "symbol": "Commit: A quiet and intuition moment is on the table.",
    "signal": "A decision wants follow-through. Emphasize reset.",
    "shadow": "Half-commitment drains energy. Watch for drift.",
    "directive": "Commit fully. Keep it quiet and intuition.",
    "practice": "Delete one option; double down on one.",
    "journal": "What am I doing halfway?",
    "tags": [
      "focus",
      "commit",
      "reset"
=======
    "key": "Pisces_13",
    "sign": "Pisces",
    "degree": 13,
    "symbol": "A healer tending to a patient.",
    "signal": "Compassion and the healing process.",
    "shadow": "Neglecting your own well-being while caring for others.",
    "directive": "Prioritize self-care while supporting those in need.",
    "practice": "Schedule time for self-care activities that rejuvenate you.",
    "journal": "How can I better balance caring for myself and others?",
    "tags": [
      "healing",
      "compassion",
      "self-care"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 343,
<<<<<<< Updated upstream
    "key": "Pisces 14",
    "sign": "Pisces",
    "degree": 14,
    "symbol": "Boundaries: A quiet and intuition moment is on the table.",
    "signal": "Limits protect value. Emphasize reset.",
    "shadow": "Saying yes too fast costs you. Watch for drift.",
    "directive": "Set a boundary. Keep it quiet and intuition.",
    "practice": "Say no to one low-value request.",
    "journal": "What deserves my \u2018no\u2019?",
    "tags": [
      "boundaries",
      "focus",
      "reset"
=======
    "key": "Pisces_14",
    "sign": "Pisces",
    "degree": 14,
    "symbol": "A butterfly emerging from a chrysalis.",
    "signal": "Transformation and personal growth.",
    "shadow": "Resistance to change and growth.",
    "directive": "Embrace the changes that lead to your personal evolution.",
    "practice": "Identify an area of your life where you can embrace change and take a small step.",
    "journal": "What transformations am I currently resisting?",
    "tags": [
      "transformation",
      "growth",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 344,
<<<<<<< Updated upstream
    "key": "Pisces 15",
    "sign": "Pisces",
    "degree": 15,
    "symbol": "Mirror: A quiet and intuition moment is on the table.",
    "signal": "Feedback reveals reality. Emphasize reset.",
    "shadow": "Defensiveness blocks learning. Watch for drift.",
    "directive": "Take the note. Keep it quiet and intuition.",
    "practice": "Ask for one piece of honest feedback.",
    "journal": "What am I not seeing?",
    "tags": [
      "mirror",
      "focus",
      "reset"
=======
    "key": "Pisces_15",
    "sign": "Pisces",
    "degree": 15,
    "symbol": "A wise elder sharing knowledge.",
    "signal": "Wisdom and mentorship.",
    "shadow": "Ignoring the lessons of experience.",
    "directive": "Seek wisdom from those who have walked the path before you.",
    "practice": "Reach out to a mentor or someone whose experience you respect for guidance.",
    "journal": "What lessons have I learned that I can share with others?",
    "tags": [
      "wisdom",
      "mentorship",
      "experience"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 345,
<<<<<<< Updated upstream
    "key": "Pisces 16",
    "sign": "Pisces",
    "degree": 16,
    "symbol": "Repair: A quiet and intuition moment is on the table.",
    "signal": "Something wants fixing. Emphasize reset.",
    "shadow": "Avoidance compounds cost. Watch for drift.",
    "directive": "Repair it. Keep it quiet and intuition.",
    "practice": "Fix one broken thing (literal or process).",
    "journal": "What maintenance have I postponed?",
    "tags": [
      "focus",
      "reset",
      "repair"
=======
    "key": "Pisces_16",
    "sign": "Pisces",
    "degree": 16,
    "symbol": "A tranquil lake reflecting the sky.",
    "signal": "Peace and inner calm.",
    "shadow": "Disruption and chaos in your inner world.",
    "directive": "Cultivate inner peace through mindfulness and reflection.",
    "practice": "Engage in a meditation or mindfulness practice to center yourself.",
    "journal": "What practices help me find peace in my daily life?",
    "tags": [
      "peace",
      "mindfulness",
      "calm"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 346,
<<<<<<< Updated upstream
    "key": "Pisces 17",
    "sign": "Pisces",
    "degree": 17,
    "symbol": "Focus: A quiet and intuition moment is on the table.",
    "signal": "Attention is currency. Emphasize reset.",
    "shadow": "Multitasking reduces quality. Watch for drift.",
    "directive": "Single-task. Keep it quiet and intuition.",
    "practice": "One task, one tab, 45 minutes.",
    "journal": "Where is my attention leaking?",
    "tags": [
      "focus",
      "reset"
=======
    "key": "Pisces_17",
    "sign": "Pisces",
    "degree": 17,
    "symbol": "A child playing in a garden.",
    "signal": "Joy and innocence.",
    "shadow": "Loss of playfulness and joy in life.",
    "directive": "Reconnect with your inner child and embrace joy.",
    "practice": "Engage in a playful activity that brings you joy and laughter.",
    "journal": "When was the last time I truly felt joy? What brought it about?",
    "tags": [
      "joy",
      "playfulness",
      "innocence"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 347,
<<<<<<< Updated upstream
    "key": "Pisces 18",
    "sign": "Pisces",
    "degree": 18,
    "symbol": "Standard: A quiet and intuition moment is on the table.",
    "signal": "Quality needs definition. Emphasize reset.",
    "shadow": "Vague standards create stress. Watch for drift.",
    "directive": "Define the standard. Keep it quiet and intuition.",
    "practice": "Write a checklist for 'done'.",
    "journal": "What does 'done' mean here?",
    "tags": [
      "focus",
      "reset",
      "standard"
=======
    "key": "Pisces_18",
    "sign": "Pisces",
    "degree": 18,
    "symbol": "A lighthouse guiding ships at sea.",
    "signal": "Guidance and direction.",
    "shadow": "Feeling lost or without purpose.",
    "directive": "Seek clarity on your goals and the direction you want to take.",
    "practice": "Create a vision board that reflects your aspirations and goals.",
    "journal": "What is my current direction, and how can I align it with my true purpose?",
    "tags": [
      "guidance",
      "direction",
      "purpose"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 348,
<<<<<<< Updated upstream
    "key": "Pisces 19",
    "sign": "Pisces",
    "degree": 19,
    "symbol": "Tempo: A quiet and intuition moment is on the table.",
    "signal": "Timing matters. Emphasize reset.",
    "shadow": "Forcing pace breaks form. Watch for drift.",
    "directive": "Set the pace. Keep it quiet and intuition.",
    "practice": "Choose slow/steady/fast and stick to it.",
    "journal": "What pace is sustainable?",
    "tags": [
      "focus",
      "tempo",
      "reset"
=======
    "key": "Pisces_19",
    "sign": "Pisces",
    "degree": 19,
    "symbol": "A person immersed in a creative endeavor.",
    "signal": "Embrace your artistic side and express your emotions.",
    "shadow": "Avoid becoming overly self-critical or lost in fantasy.",
    "directive": "Engage in a creative project that allows for emotional expression.",
    "practice": "Dedicate time each week to a form of art or writing that resonates with you.",
    "journal": "What emotions are you currently holding back that could be expressed creatively?",
    "tags": [
      "creativity",
      "expression",
      "art"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 349,
<<<<<<< Updated upstream
    "key": "Pisces 20",
    "sign": "Pisces",
    "degree": 20,
    "symbol": "Risk: A quiet and intuition moment is on the table.",
    "signal": "A calculated step is required. Emphasize reset.",
    "shadow": "Impulse risk is not courage. Watch for drift.",
    "directive": "Take a measured risk. Keep it quiet and intuition.",
    "practice": "Take the smallest risky step today.",
    "journal": "What risk is worth it?",
    "tags": [
      "focus",
      "reset",
      "risk"
=======
    "key": "Pisces_20",
    "sign": "Pisces",
    "degree": 20,
    "symbol": "A group of people gathered for a common cause.",
    "signal": "Collaboration can lead to greater achievements.",
    "shadow": "Beware of groupthink or losing your individuality.",
    "directive": "Join or initiate a community project that aligns with your values.",
    "practice": "Volunteer for a cause that resonates with your beliefs.",
    "journal": "How can you contribute your unique skills to a collective effort?",
    "tags": [
      "community",
      "collaboration",
      "service"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 350,
<<<<<<< Updated upstream
    "key": "Pisces 21",
    "sign": "Pisces",
    "degree": 21,
    "symbol": "Integration: A quiet and intuition moment is on the table.",
    "signal": "Pieces want alignment. Emphasize reset.",
    "shadow": "Fragmentation creates fatigue. Watch for drift.",
    "directive": "Integrate. Keep it quiet and intuition.",
    "practice": "Combine two related tasks into one flow.",
    "journal": "What should be unified?",
    "tags": [
      "integration",
      "focus",
      "reset"
=======
    "key": "Pisces_21",
    "sign": "Pisces",
    "degree": 21,
    "symbol": "A healer working with energy.",
    "signal": "Focus on healing yourself and others through compassion.",
    "shadow": "Avoid becoming drained by others' emotional needs.",
    "directive": "Practice self-care and offer support to those in need.",
    "practice": "Incorporate mindfulness or meditation into your routine.",
    "journal": "What boundaries do you need to set to protect your energy?",
    "tags": [
      "healing",
      "compassion",
      "boundaries"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 351,
<<<<<<< Updated upstream
    "key": "Pisces 22",
    "sign": "Pisces",
    "degree": 22,
    "symbol": "Authority: A quiet and intuition moment is on the table.",
    "signal": "Own responsibility. Emphasize reset.",
    "shadow": "Blame delays progress. Watch for drift.",
    "directive": "Take ownership. Keep it quiet and intuition.",
    "practice": "Write what you control; act on one item.",
    "journal": "What is mine to handle?",
    "tags": [
      "focus",
      "authority",
      "reset"
=======
    "key": "Pisces_22",
    "sign": "Pisces",
    "degree": 22,
    "symbol": "A dreamer gazing at the stars.",
    "signal": "Allow your imagination to guide you towards new possibilities.",
    "shadow": "Watch for escapism or neglecting practical matters.",
    "directive": "Set aside time to dream and envision your future.",
    "practice": "Create a vision board that reflects your aspirations.",
    "journal": "What dreams have you set aside that deserve your attention again?",
    "tags": [
      "dreams",
      "vision",
      "imagination"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 352,
<<<<<<< Updated upstream
    "key": "Pisces 23",
    "sign": "Pisces",
    "degree": 23,
    "symbol": "Refine: A quiet and intuition moment is on the table.",
    "signal": "Polish after completion. Emphasize reset.",
    "shadow": "Editing before finishing stalls. Watch for drift.",
    "directive": "Refine the finished draft. Keep it quiet and intuition.",
    "practice": "Make 3 edits to what\u2019s done.",
    "journal": "What can I improve without restarting?",
    "tags": [
      "refine",
      "focus",
      "reset"
=======
    "key": "Pisces_23",
    "sign": "Pisces",
    "degree": 23,
    "symbol": "A wise elder sharing knowledge.",
    "signal": "Seek wisdom from those with experience.",
    "shadow": "Avoid dismissing the insights of others too quickly.",
    "directive": "Engage in conversations with mentors or elders.",
    "practice": "Read books or attend workshops that broaden your understanding.",
    "journal": "Who can you turn to for guidance in your current situation?",
    "tags": [
      "wisdom",
      "mentorship",
      "learning"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 353,
<<<<<<< Updated upstream
    "key": "Pisces 24",
    "sign": "Pisces",
    "degree": 24,
    "symbol": "Stewardship: A quiet and intuition moment is on the table.",
    "signal": "Resources need care. Emphasize reset.",
    "shadow": "Waste hides in habits. Watch for drift.",
    "directive": "Protect resources. Keep it quiet and intuition.",
    "practice": "Automate/limit one recurring drain.",
    "journal": "What am I spending without noticing?",
    "tags": [
      "reset",
      "stewardship"
=======
    "key": "Pisces_24",
    "sign": "Pisces",
    "degree": 24,
    "symbol": "A ship navigating through fog.",
    "signal": "Trust your intuition to guide you through uncertainty.",
    "shadow": "Be cautious of indecision or fear of the unknown.",
    "directive": "Take calculated risks and move forward despite uncertainty.",
    "practice": "Journal about your fears and how you can address them.",
    "journal": "What steps can you take to navigate through your current uncertainties?",
    "tags": [
      "intuition",
      "navigation",
      "risk"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 354,
<<<<<<< Updated upstream
    "key": "Pisces 25",
    "sign": "Pisces",
    "degree": 25,
    "symbol": "Signal-to-noise: A quiet and intuition moment is on the table.",
    "signal": "Simplify inputs. Emphasize reset.",
    "shadow": "Overconsumption clouds judgment. Watch for drift.",
    "directive": "Reduce intake. Keep it quiet and intuition.",
    "practice": "No news/social for 4 hours.",
    "journal": "What input is distorting me?",
    "tags": [
      "signal-to-noise",
      "focus",
      "reset"
=======
    "key": "Pisces_25",
    "sign": "Pisces",
    "degree": 25,
    "symbol": "A waterfall cascading down rocks.",
    "signal": "Embrace the flow of life and let go of resistance.",
    "shadow": "Avoid becoming stagnant or overly rigid in your plans.",
    "directive": "Allow yourself to adapt to changing circumstances.",
    "practice": "Practice flexibility in your daily routines and decisions.",
    "journal": "What areas of your life need more flow and less control?",
    "tags": [
      "flow",
      "adaptability",
      "change"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 355,
<<<<<<< Updated upstream
    "key": "Pisces 26",
    "sign": "Pisces",
    "degree": 26,
    "symbol": "Sustain: A quiet and intuition moment is on the table.",
    "signal": "Make it last. Emphasize reset.",
    "shadow": "Burnout follows spikes. Watch for drift.",
    "directive": "Sustain. Keep it quiet and intuition.",
    "practice": "Plan tomorrow\u2019s first hour now.",
    "journal": "What keeps me steady?",
    "tags": [
      "focus",
      "sustain",
      "reset"
=======
    "key": "Pisces_26",
    "sign": "Pisces",
    "degree": 26,
    "symbol": "A musician playing a soulful melody.",
    "signal": "Music and sound can be powerful tools for healing and connection.",
    "shadow": "Be wary of using music as an escape rather than a tool for expression.",
    "directive": "Incorporate music into your daily life for emotional release.",
    "practice": "Create a playlist that reflects your current feelings and listen mindfully.",
    "journal": "How does music influence your emotions and experiences?",
    "tags": [
      "music",
      "healing",
      "emotion"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 356,
<<<<<<< Updated upstream
    "key": "Pisces 27",
    "sign": "Pisces",
    "degree": 27,
    "symbol": "Legacy: A quiet and intuition moment is on the table.",
    "signal": "Long-term view matters. Emphasize reset.",
    "shadow": "Short-term ego derails. Watch for drift.",
    "directive": "Think long. Keep it quiet and intuition.",
    "practice": "Write the 1-year consequence of today\u2019s choice.",
    "journal": "What will matter in a year?",
    "tags": [
      "stewardship",
      "legacy",
      "reset"
=======
    "key": "Pisces_27",
    "sign": "Pisces",
    "degree": 27,
    "symbol": "A child playing in a field.",
    "signal": "Reconnect with your inner child and embrace joy.",
    "shadow": "Avoid becoming overly serious or neglecting playfulness.",
    "directive": "Engage in activities that bring you joy and laughter.",
    "practice": "Schedule time for play or hobbies that make you feel alive.",
    "journal": "What activities make you feel like a child again?",
    "tags": [
      "joy",
      "play",
      "childhood"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 357,
<<<<<<< Updated upstream
    "key": "Pisces 28",
    "sign": "Pisces",
    "degree": 28,
    "symbol": "Closure: A quiet and intuition moment is on the table.",
    "signal": "Finish cycles. Emphasize reset.",
    "shadow": "Open loops drain attention. Watch for drift.",
    "directive": "Close the loop. Keep it quiet and intuition.",
    "practice": "Send the final message / file the final note.",
    "journal": "What needs closure?",
    "tags": [
      "closure",
      "focus",
      "reset"
=======
    "key": "Pisces_28",
    "sign": "Pisces",
    "degree": 28,
    "symbol": "A person meditating by a tranquil lake.",
    "signal": "Find peace within through solitude and reflection.",
    "shadow": "Beware of isolation leading to disconnection from others.",
    "directive": "Make time for quiet reflection and meditation.",
    "practice": "Spend time in nature to recharge and reconnect with yourself.",
    "journal": "What thoughts or feelings arise when you sit in silence?",
    "tags": [
      "meditation",
      "solitude",
      "reflection"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 358,
<<<<<<< Updated upstream
    "key": "Pisces 29",
    "sign": "Pisces",
    "degree": 29,
    "symbol": "Threshold: A quiet and intuition moment is on the table.",
    "signal": "A transition is near. Emphasize reset.",
    "shadow": "Hesitation creates drift. Watch for drift.",
    "directive": "Cross the threshold. Keep it quiet and intuition.",
    "practice": "Choose the next chapter\u2019s first step.",
    "journal": "What am I ready to enter?",
    "tags": [
      "threshold",
      "focus",
      "reset"
=======
    "key": "Pisces_29",
    "sign": "Pisces",
    "degree": 29,
    "symbol": "A visionary painting a mural.",
    "signal": "Your unique perspective can inspire and uplift others.",
    "shadow": "Avoid becoming overly critical of your own vision.",
    "directive": "Share your ideas and creativity with the world.",
    "practice": "Collaborate on a project that showcases your vision.",
    "journal": "What message do you want to share through your creative expression?",
    "tags": [
      "vision",
      "inspiration",
      "creativity"
>>>>>>> Stashed changes
    ]
  },
  {
    "idx": 359,
<<<<<<< Updated upstream
    "key": "Pisces 30",
    "sign": "Pisces",
    "degree": 30,
    "symbol": "Completion: A quiet and intuition moment is on the table.",
    "signal": "Harvest the result. Emphasize reset.",
    "shadow": "Skipping review repeats mistakes. Watch for drift.",
    "directive": "Complete and review. Keep it quiet and intuition.",
    "practice": "Write: what worked / didn\u2019t / next.",
    "journal": "What did this cycle teach me?",
    "tags": [
      "focus",
      "reset",
      "completion"
    ]
  }
];
=======
    "key": "Pisces_30",
    "sign": "Pisces",
    "degree": 30,
    "symbol": "A phoenix rising from the ashes.",
    "signal": "Transformation and renewal are possible through resilience.",
    "shadow": "Be cautious of clinging to the past and resisting change.",
    "directive": "Embrace opportunities for personal growth and transformation.",
    "practice": "Identify an area of your life where you can let go and start anew.",
    "journal": "What aspects of your life are ready for transformation?",
    "tags": [
      "transformation",
      "resilience",
      "renewal"
    ]
  }
];
>>>>>>> Stashed changes
