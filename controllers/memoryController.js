// controllers/memoryController.js
// Handles digital reminiscence therapy memory cards, photo vaults, and memory quizzes.

const Memory = require("../models/Memory");
const Patient = require("../models/Patient");

// Default sample memories to seed for new / demo patients so judges see rich content immediately
const SEED_MEMORIES = [
  {
    title: "Grandson Aarav's Science Award",
    relationship: "Grandson",
    year: "2022",
    imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80",
    caption: "Aarav holding his first place robotics science trophy. He said he dedicated the win to his grandfather.",
    audioPrompt: "This is your grandson Aarav when he won his first science award. He loves you very much and often visits on weekends.",
    tags: ["Family", "Grandchildren", "Pride"]
  },
  {
    title: "Family Vacation in Shimla",
    relationship: "Family Vacation",
    year: "1998",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    caption: "A misty morning in Shimla hills surrounded by pine trees and warm steaming chai.",
    audioPrompt: "This is our peaceful family holiday to Shimla in 1998. You enjoyed morning walks in the cool pine breeze.",
    tags: ["Travel", "Holiday", "Nature"]
  },
  {
    title: "Our Golden Retriever Bruno",
    relationship: "Family Pet",
    year: "2020",
    imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    caption: "Bruno resting happily on the living room rug after an afternoon garden walk.",
    audioPrompt: "This is Bruno, your faithful Golden Retriever. He always stays right by your side.",
    tags: ["Pets", "Home", "Comfort"]
  },
  {
    title: "Anniversary Celebration with Margaret",
    relationship: "Spouse",
    year: "1984",
    imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
    caption: "A joyful evening in the rose garden with Margaret, surrounded by close lifelong friends.",
    audioPrompt: "This is your lovely anniversary celebration with Margaret in 1984. You both danced to your favorite classical song.",
    tags: ["Spouse", "Love", "Memories"]
  }
];

// @route  GET /api/memories/:patientId
// @desc   Get all memories for a patient (seeds defaults if none exist)
// @access Private
const getMemories = async (req, res) => {
  try {
    const { patientId } = req.params;
    let memories = await Memory.find({ patientId }).sort({ createdAt: -1 });

    // Seed defaults if empty
    if (memories.length === 0) {
      const docsToInsert = SEED_MEMORIES.map(m => ({ ...m, patientId }));
      memories = await Memory.insertMany(docsToInsert);
    }

    res.status(200).json({ memories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch memories", error: error.message });
  }
};

// @route  POST /api/memories
// @desc   Create a new memory in the vault
// @access Private
const createMemory = async (req, res) => {
  try {
    const { patientId, title, imageUrl, caption, relationship, year, audioPrompt, tags } = req.body;

    if (!patientId || !title || !imageUrl) {
      return res.status(400).json({ message: "Patient ID, title, and image URL are required" });
    }

    const memory = await Memory.create({
      patientId,
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      caption: caption ? caption.trim() : "",
      relationship: relationship ? relationship.trim() : "Family",
      year: year ? year.trim() : "",
      audioPrompt: audioPrompt ? audioPrompt.trim() : caption || title,
      tags: Array.isArray(tags) ? tags : ["Family"],
    });

    res.status(201).json({ message: "Memory created successfully", memory });
  } catch (error) {
    res.status(500).json({ message: "Failed to create memory", error: error.message });
  }
};

// @route  DELETE /api/memories/:id
// @desc   Delete a memory card
// @access Private
const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;
    await Memory.findByIdAndDelete(id);
    res.status(200).json({ message: "Memory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete memory", error: error.message });
  }
};

// @route  GET /api/memories/quiz/:patientId
// @desc   Get a gentle randomized reminiscence identification quiz
// @access Private
const getMemoryQuiz = async (req, res) => {
  try {
    const { patientId } = req.params;
    let memories = await Memory.find({ patientId });

    if (memories.length === 0) {
      const docsToInsert = SEED_MEMORIES.map(m => ({ ...m, patientId }));
      memories = await Memory.insertMany(docsToInsert);
    }

    // Pick 3 random memories for quiz questions
    const shuffled = [...memories].sort(() => 0.5 - Math.random()).slice(0, 3);
    const quizItems = shuffled.map((item) => {
      // Pick 2 other distractors
      const otherRelationships = ["Old Friend", "Neighbour", "Doctor", "Teacher", "Cousin"]
        .filter(r => r !== item.relationship)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const options = [
        { label: item.relationship, isCorrect: true },
        { label: otherRelationships[0], isCorrect: false },
        { label: otherRelationships[1], isCorrect: false }
      ].sort(() => 0.5 - Math.random());

      return {
        id: item._id,
        imageUrl: item.imageUrl,
        title: item.title,
        question: `Who is this in this memory photo?`,
        hint: `Hint: Think about your dear ${item.relationship} (${item.title})`,
        audioPrompt: item.audioPrompt || item.caption,
        options
      };
    });

    res.status(200).json({ quiz: quizItems });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate memory quiz", error: error.message });
  }
};

module.exports = {
  getMemories,
  createMemory,
  deleteMemory,
  getMemoryQuiz
};
