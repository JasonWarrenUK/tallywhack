import React, { useState, useEffect } from "react";
import { Heart, X, RotateCcw, Sparkles } from "lucide-react";

export default function BabyNameFinder() {
  const [screen, setScreen] = useState(1);
  const [loading, setLoading] = useState(false);

  // Screen 1 state
  const [genders, setGenders] = useState([]);
  const [themes, setThemes] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [uniqueness, setUniqueness] = useState(50);

  // Screen 2 state
  const [exampleNames, setExampleNames] = useState([]);
  const [ratings, setRatings] = useState({});
  const [currentExample, setCurrentExample] = useState(0);

  // Screen 3 state
  const [finalNames, setFinalNames] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState(null);
  const [rejectedNames, setRejectedNames] = useState(new Set());

  // Add dark mode range input styling
  const rangeStyle = `
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      background: #4F46E5;
      cursor: pointer;
      border-radius: 50%;
    }
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: #4F46E5;
      cursor: pointer;
      border-radius: 50%;
      border: none;
    }
  `;

  const themeOptions = [
    "Nature",
    "Mythology",
    "Literature",
    "Vintage",
    "Modern",
    "Royal",
    "Musical",
    "Celestial",
    "Virtue",
    "Place names",
  ];

  const cultureOptions = [
    "English",
    "Irish",
    "Scottish",
    "Welsh",
    "French",
    "Spanish",
    "Italian",
    "German",
    "Scandinavian",
    "Greek",
    "Hebrew",
    "Arabic",
    "Japanese",
    "Chinese",
    "Indian",
    "African",
  ];

  const toggleItem = (item, setter, state) => {
    if (state.includes(item)) {
      setter(state.filter((i) => i !== item));
    } else {
      setter([...state, item]);
    }
  };

  const startTasteRefinement = async () => {
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      const prompt = `Generate 20 diverse baby names for taste refinement based on these preferences:

FILTERS (all filters must apply to each name):
- Genders: ${genders.length ? genders.join(" OR ") : "any gender"}
- Themes: ${themes.length ? `MUST be ${themes.join(" OR ")} themed` : "any theme"}
- Cultures: ${cultures.length ? `MUST be from ${cultures.join(" OR ")} origin` : "any culture"}
- Uniqueness (0-100): ${uniqueness} ${uniqueness < 35 ? "(prefer common/traditional names)" : uniqueness > 65 ? "(prefer unique/unusual names)" : "(balanced mix)"}

Ensure names span the full range of the preferences to test the user's taste. Every name must satisfy ALL the filters above.

CRITICAL: Your response must be ONLY a JSON array. No explanation, no preamble, no markdown formatting, no text before or after. Start with [ and end with ].

Format:
[{"name": "Example", "gender": "male/female/neutral", "origin": "culture"}]`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message ||
            errorData.message ||
            response.statusText;
        } catch (e) {
          errorMessage = response.statusText || `HTTP error ${response.status}`;
        }
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();

      if (!data || !data.content) {
        throw new Error("Response missing content field");
      }

      const textBlock = data.content.find((c) => c.type === "text");
      if (!textBlock || !textBlock.text) {
        throw new Error("Response missing text content");
      }

      const text = textBlock.text;

      // Remove markdown code blocks
      let cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

      // Extract just the JSON array if there's any preamble
      const arrayStart = cleaned.indexOf("[");
      const arrayEnd = cleaned.lastIndexOf("]");

      if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error(
          `No JSON array found. Response: "${cleaned.substring(0, 100)}..."`,
        );
      }

      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);

      let names;
      try {
        names = JSON.parse(cleaned);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }

      if (!Array.isArray(names)) {
        throw new Error(`Expected array but got ${typeof names}`);
      }

      if (names.length === 0) {
        throw new Error(
          "API returned empty array - filters may be too restrictive",
        );
      }

      // Validate name structure
      const firstInvalid = names.find((n) => !n.name || !n.gender || !n.origin);
      if (firstInvalid) {
        throw new Error(
          `Invalid name structure: ${JSON.stringify(firstInvalid)}`,
        );
      }

      setExampleNames(names);
      setScreen(2);
    } catch (error) {
      console.error("Error generating examples:", error);
      setError(error.message || error.toString() || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const rateExample = (rating) => {
    const name = exampleNames[currentExample].name;
    const updatedRatings = { ...ratings, [name]: rating };
    setRatings(updatedRatings);

    if (currentExample < exampleNames.length - 1) {
      setCurrentExample((prev) => prev + 1);
    } else {
      // Initial generation - start with empty rejected set
      setRejectedNames(new Set());
      generateFinalNames([], 10, updatedRatings, new Set());
    }
  };

  const generateFinalNames = async (
    keptNames = [],
    countNeeded = 10,
    ratingsToUse = null,
    rejectedSet = new Set(),
  ) => {
    setLoading(true);
    setError(null);
    const activeRatings = ratingsToUse || ratings;

    console.log("Starting final name generation");
    console.log("Active ratings:", activeRatings);
    console.log("Kept names:", keptNames);
    console.log("Count needed:", countNeeded);
    console.log("Rejected names:", Array.from(rejectedSet));

    try {
      const liked = Object.entries(activeRatings)
        .filter(([_, r]) => r === "like")
        .map(([n]) => n);
      const disliked = Object.entries(activeRatings)
        .filter(([_, r]) => r === "dislike")
        .map(([n]) => n);

      console.log("Liked:", liked);
      console.log("Disliked:", disliked);

      const keptNameStrings = keptNames.map((n) => n.name);
      const allExclusions = [...keptNameStrings, ...Array.from(rejectedSet)];

      const prompt = `Generate ${countNeeded} baby names based on these preferences:

FILTERS (all filters must apply to each name):
- Genders: ${genders.length ? genders.join(" OR ") : "any gender"}
- Themes: ${themes.length ? `MUST be ${themes.join(" OR ")} themed` : "any theme"}
- Cultures: ${cultures.length ? `MUST be from ${cultures.join(" OR ")} origin` : "any culture"}
- Uniqueness (0-100): ${uniqueness} ${uniqueness < 35 ? "(prefer common/traditional names)" : uniqueness > 65 ? "(prefer unique/unusual names)" : "(balanced mix)"}

LEARNED TASTE:
- Liked names: ${liked.join(", ")}
- Disliked names: ${disliked.join(", ")}
${allExclusions.length ? `- DO NOT suggest any of these names: ${allExclusions.join(", ")}` : ""}

Analyze the patterns in liked vs disliked names to understand the user's nuanced taste. Every name must satisfy ALL the filters above.

CRITICAL: Your response must be ONLY a JSON array. No explanation, no preamble, no markdown formatting, no text before or after. Start with [ and end with ].

Format:
[{"name": "Example", "gender": "male/female/neutral", "origin": "culture", "meaning": "brief meaning"}]`;

      console.log("Making API call...");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("API error response:", errorData);
          errorMessage =
            errorData.error?.message ||
            errorData.message ||
            response.statusText;
        } catch (e) {
          errorMessage = response.statusText || `HTTP error ${response.status}`;
        }
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      if (!data || !data.content) {
        throw new Error("Response missing content field");
      }

      const textBlock = data.content.find((c) => c.type === "text");
      if (!textBlock || !textBlock.text) {
        throw new Error("Response missing text content");
      }

      const text = textBlock.text;
      console.log("Extracted text:", text);

      // Remove markdown code blocks
      let cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      console.log("After markdown removal:", cleaned);

      // Extract just the JSON array if there's any preamble
      const arrayStart = cleaned.indexOf("[");
      const arrayEnd = cleaned.lastIndexOf("]");

      console.log("Array boundaries:", arrayStart, arrayEnd);

      if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error(
          `No JSON array found. Response started with: "${cleaned.substring(0, 100)}..."`,
        );
      }

      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
      console.log("Extracted array:", cleaned.substring(0, 200));

      let names;
      try {
        names = JSON.parse(cleaned);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Attempted to parse:", cleaned.substring(0, 200));
        throw new Error(
          `Failed to parse JSON: ${parseError.message}. Text: "${cleaned.substring(0, 100)}..."`,
        );
      }

      console.log("Parsed names:", names);

      if (!Array.isArray(names)) {
        throw new Error(`Expected array but got ${typeof names}`);
      }

      if (names.length === 0) {
        throw new Error(
          "API returned empty array - filters may be too restrictive",
        );
      }

      // Validate name structure
      const firstInvalid = names.find(
        (n) => !n.name || !n.gender || !n.origin || !n.meaning,
      );
      if (firstInvalid) {
        throw new Error(
          `Invalid name structure: ${JSON.stringify(firstInvalid)}`,
        );
      }

      // Combine kept names with new names
      const combinedNames = [...keptNames, ...names];
      console.log("Combined names:", combinedNames);

      setFinalNames(combinedNames);
      setSelected(new Set(keptNameStrings));
      setScreen(3);
    } catch (error) {
      console.error("Error generating final names:", error);
      setError(error.message || error.toString() || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const regenerateUnselected = () => {
    setError(null);
    const selectedNames = finalNames.filter((n) => selected.has(n.name));
    const unselectedNames = finalNames.filter((n) => !selected.has(n.name));

    // Add unselected names to the rejected set
    const newRejected = new Set([
      ...rejectedNames,
      ...unselectedNames.map((n) => n.name),
    ]);
    setRejectedNames(newRejected);

    const countNeeded = 10 - selectedNames.length;
    generateFinalNames(selectedNames, countNeeded, null, newRejected);
  };

  // Screen 1: Preferences
  if (screen === 1) {
    return (
      <>
        <style>{rangeStyle}</style>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
          <div className="max-w-3xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold text-gray-100">
                Find Your Perfect Name
              </h1>
            </div>

            <div className="space-y-8">
              {/* Gender */}
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-3">
                  Gender (optional)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {["Male", "Female", "Gender neutral"].map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleItem(g, setGenders, genders)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        genders.includes(g)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-3">
                  Themes (optional)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {themeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleItem(t, setThemes, themes)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        themes.includes(t)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cultures */}
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-3">
                  Cultures (optional)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cultureOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleItem(c, setCultures, cultures)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        cultures.includes(c)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uniqueness */}
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-3">
                  Name Style:{" "}
                  {uniqueness < 35
                    ? "Commonplace"
                    : uniqueness > 65
                      ? "Unique"
                      : "Balanced"}
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 w-24">
                    Commonplace
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={uniqueness}
                    onChange={(e) => setUniqueness(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-400 w-24 text-right">
                    Unique
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setError(null);
                  startTasteRefinement();
                }}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-500 transition-colors disabled:bg-gray-600"
              >
                {loading ? "Loading..." : "Next: Refine My Taste"}
              </button>

              {error && !loading && (
                <div className="mt-4 p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-red-300 text-sm whitespace-pre-wrap break-words">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Screen 2: Taste Refinement
  if (screen === 2) {
    if (loading || error) {
      return (
        <>
          <style>{rangeStyle}</style>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-700">
              {error ? (
                <>
                  <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-100 mb-2">
                    Something went wrong
                  </h2>
                  <div className="max-h-60 overflow-y-auto mb-6">
                    <p className="text-gray-400 text-sm whitespace-pre-wrap break-words">
                      {error}
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setError(null);
                        setScreen(1);
                        setRejectedNames(new Set());
                        setSelected(new Set());
                        setFinalNames([]);
                      }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-semibold"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => {
                        setError(null);
                        generateFinalNames([], 10, ratings, rejectedNames);
                      }}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold text-gray-100 mb-2">
                    Analysing your taste...
                  </h2>
                  <p className="text-gray-400">
                    Generating personalized names based on your preferences
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      );
    }

    const current = exampleNames[currentExample];
    const progress = ((currentExample + 1) / exampleNames.length) * 100;

    return (
      <>
        <style>{rangeStyle}</style>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>
                  Name {currentExample + 1} of {exampleNames.length}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-gray-100">
                {current.name}
              </h2>
              <div className="text-gray-400">
                <p className="capitalize">{current.gender}</p>
                <p className="text-sm">{current.origin} origin</p>
              </div>

              <p className="text-gray-500 text-sm">
                How do you feel about this name?
              </p>

              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={() => rateExample("dislike")}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                  Dislike
                </button>
                <button
                  onClick={() => rateExample("neutral")}
                  disabled={loading}
                  className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Neutral
                </button>
                <button
                  onClick={() => rateExample("like")}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-700 hover:bg-green-900 text-gray-300 hover:text-green-300 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Heart className="w-5 h-5" />
                  Like
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Screen 3: Final Names
  return (
    <>
      <style>{rangeStyle}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold text-gray-100">
                Your Personalized Names
              </h1>
            </div>
            <button
              onClick={() => {
                setScreen(1);
                setRejectedNames(new Set());
                setSelected(new Set());
                setFinalNames([]);
                setError(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Start Over
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {finalNames.map((name, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                  selected.has(name.name)
                    ? "border-indigo-500 bg-indigo-900 bg-opacity-30"
                    : "border-gray-700 hover:border-gray-600 bg-gray-700"
                }`}
                onClick={() => {
                  const newSelected = new Set(selected);
                  if (newSelected.has(name.name)) {
                    newSelected.delete(name.name);
                  } else {
                    newSelected.add(name.name);
                  }
                  setSelected(newSelected);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-100 mb-2">
                      {name.name}
                    </h3>
                    <p className="text-gray-400 mb-1 capitalize">
                      {name.gender}
                    </p>
                    <p className="text-gray-500 text-sm mb-2">
                      {name.origin} origin
                    </p>
                    <p className="text-gray-300">{name.meaning}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected.has(name.name)}
                    onChange={() => {}}
                    className="w-6 h-6 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={regenerateUnselected}
            disabled={loading || selected.size === 0}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-500 transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {loading
              ? "Generating..."
              : selected.size === 0
                ? "Select names to keep, then regenerate"
                : `Regenerate ${finalNames.length - selected.size} name${finalNames.length - selected.size !== 1 ? "s" : ""}`}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg max-h-40 overflow-y-auto">
              <p className="text-red-300 text-sm text-center whitespace-pre-wrap break-words">
                {error}
              </p>
            </div>
          )}

          {selected.size > 0 && !error && (
            <p className="text-center text-gray-400 text-sm mt-4">
              Keeping {selected.size} name{selected.size !== 1 ? "s" : ""},
              regenerating the rest
              {rejectedNames.size > 0 &&
                ` • ${rejectedNames.size} name${rejectedNames.size !== 1 ? "s" : ""} excluded from future suggestions`}
            </p>
          )}

          {selected.size === 0 && rejectedNames.size > 0 && !error && (
            <p className="text-center text-gray-400 text-sm mt-4">
              {rejectedNames.size} name{rejectedNames.size !== 1 ? "s" : ""}{" "}
              excluded from future suggestions
            </p>
          )}
        </div>
      </div>
    </>
  );
}
