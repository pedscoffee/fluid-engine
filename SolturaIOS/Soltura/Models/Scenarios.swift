//
//  Scenarios.swift
//  Soltura
//
//  Conversation scenarios for Spanish practice
//

import Foundation

struct Scenario: Identifiable, Hashable {
    let id: String
    let title: String
    let instruction: String
    let category: String
}

struct ScenarioData {
    static let categories = [
        "Dining & Food",
        "Health & Wellness",
        "Travel & Transportation",
        "Shopping & Services",
        "Work & Professional",
        "Social & Personal",
        "Housing & Home",
        "Education & Learning",
        "Entertainment & Culture",
        "Emergency & Special",
        "Hobbies & Interests",
        "Technology & Modern Life",
        "Customs & Culture",
        "Nature & Outdoors"
    ]

    static let scenarios: [Scenario] = [
        // DINING & FOOD
        Scenario(id: "restaurant", title: "Ordering at a Restaurant", instruction: "Practice ordering food at a Spanish restaurant. Focus on menu vocabulary, polite requests, and asking about dishes.", category: "Dining & Food"),
        Scenario(id: "cafe", title: "Coffee Shop Conversation", instruction: "Practice ordering at a café and having casual conversation. Focus on coffee/pastry vocabulary and small talk.", category: "Dining & Food"),
        Scenario(id: "cooking", title: "Cooking and Recipes", instruction: "Discuss cooking, share recipes, and talk about ingredients and techniques. Practice imperative commands.", category: "Dining & Food"),
        Scenario(id: "grocery", title: "Grocery Shopping", instruction: "Practice shopping for groceries. Focus on food items, quantities, and asking where items are located.", category: "Dining & Food"),

        // HEALTH & WELLNESS
        Scenario(id: "doctor", title: "At the Doctor's Office", instruction: "Practice describing symptoms and understanding medical advice. Focus on health vocabulary and body parts.", category: "Health & Wellness"),
        Scenario(id: "pharmacy", title: "At the Pharmacy", instruction: "Practice asking for medications and health products. Focus on explaining symptoms and understanding dosage.", category: "Health & Wellness"),
        Scenario(id: "gym", title: "At the Gym / Fitness", instruction: "Discuss exercise routines, fitness goals, and healthy habits. Focus on sports vocabulary and reflexive verbs.", category: "Health & Wellness"),

        // TRAVEL & TRANSPORTATION
        Scenario(id: "travel", title: "Travel and Directions", instruction: "Practice asking for and giving directions. Focus on location vocabulary and commands for directions.", category: "Travel & Transportation"),
        Scenario(id: "airport", title: "At the Airport", instruction: "Navigate airport situations including check-in, security, and boarding. Focus on travel vocabulary and future tense.", category: "Travel & Transportation"),
        Scenario(id: "hotel", title: "Hotel Check-in and Services", instruction: "Practice hotel check-in, asking about amenities, and requesting services. Focus on formal register and polite requests.", category: "Travel & Transportation"),
        Scenario(id: "taxi", title: "Taking a Taxi/Uber", instruction: "Practice giving directions to a driver and discussing routes. Focus on location vocabulary and polite commands.", category: "Travel & Transportation"),
        Scenario(id: "train", title: "Train/Bus Station", instruction: "Navigate public transportation. Practice asking about schedules, tickets, and platforms.", category: "Travel & Transportation"),

        // SHOPPING & SERVICES
        Scenario(id: "shopping", title: "Shopping for Clothes", instruction: "Practice shopping for clothing. Focus on colors, sizes, trying things on, and negotiating prices.", category: "Shopping & Services"),
        Scenario(id: "bank", title: "At the Bank", instruction: "Handle banking transactions. Practice formal register, financial vocabulary, and understanding procedures.", category: "Shopping & Services"),
        Scenario(id: "post_office", title: "At the Post Office", instruction: "Practice sending packages and letters. Focus on shipping vocabulary and asking about services.", category: "Shopping & Services"),
        Scenario(id: "hair_salon", title: "At the Hair Salon", instruction: "Describe what haircut or style you want. Practice appearance vocabulary and polite requests.", category: "Shopping & Services"),

        // WORK & PROFESSIONAL
        Scenario(id: "interview", title: "Job Interview", instruction: "Practice professional Spanish in a job interview context. Focus on formal register and discussing experience.", category: "Work & Professional"),
        Scenario(id: "meeting", title: "Business Meeting", instruction: "Participate in a business meeting. Practice professional vocabulary, expressing opinions, and formal communication.", category: "Work & Professional"),
        Scenario(id: "networking", title: "Professional Networking", instruction: "Practice introducing yourself professionally and making business connections.", category: "Work & Professional"),
        Scenario(id: "office", title: "Office Conversations", instruction: "Navigate everyday office interactions. Practice workplace vocabulary and polite requests to colleagues.", category: "Work & Professional"),

        // SOCIAL & PERSONAL
        Scenario(id: "phone", title: "Phone Conversation", instruction: "Practice telephone etiquette and having conversations over the phone.", category: "Social & Personal"),
        Scenario(id: "party", title: "Social Event / Party", instruction: "Practice social interactions at a party. Focus on introductions, small talk, and casual conversation.", category: "Social & Personal"),
        Scenario(id: "dating", title: "First Date Conversation", instruction: "Practice romantic conversation on a first date. Focus on getting to know someone and expressing interest.", category: "Social & Personal"),
        Scenario(id: "friends", title: "Catching Up with Friends", instruction: "Have a casual conversation with friends. Practice past tense to talk about recent events and plans.", category: "Social & Personal"),
        Scenario(id: "family", title: "Family Gathering", instruction: "Participate in family conversations. Practice talking about relationships and family vocabulary.", category: "Social & Personal"),

        // HOUSING & HOME
        Scenario(id: "apartment", title: "Renting an Apartment", instruction: "Practice looking for an apartment. Focus on housing vocabulary, asking about amenities, and negotiating terms.", category: "Housing & Home"),
        Scenario(id: "roommate", title: "Finding a Roommate", instruction: "Interview potential roommates. Practice discussing habits, preferences, and expectations.", category: "Housing & Home"),
        Scenario(id: "repair", title: "Calling for Repairs", instruction: "Report problems and request repairs. Practice describing issues and understanding appointment scheduling.", category: "Housing & Home"),

        // EDUCATION & LEARNING
        Scenario(id: "school", title: "School Enrollment", instruction: "Navigate school enrollment. Practice education vocabulary and understanding procedures.", category: "Education & Learning"),
        Scenario(id: "university", title: "University Life", instruction: "Discuss university experiences, classes, and campus life. Practice academic vocabulary.", category: "Education & Learning"),
        Scenario(id: "library", title: "At the Library", instruction: "Navigate library services. Practice asking for help finding resources and understanding library procedures.", category: "Education & Learning"),

        // ENTERTAINMENT & CULTURE
        Scenario(id: "museum", title: "Museum Visit", instruction: "Discuss art and culture at a museum. Practice describing artwork and expressing opinions.", category: "Entertainment & Culture"),
        Scenario(id: "concert", title: "Concert / Live Event", instruction: "Discuss music and attend a concert. Practice music vocabulary and expressing preferences.", category: "Entertainment & Culture"),
        Scenario(id: "movies", title: "Going to the Movies", instruction: "Buy tickets and discuss films. Practice entertainment vocabulary and expressing opinions about movies.", category: "Entertainment & Culture"),
        Scenario(id: "bookclub", title: "Book Club Discussion", instruction: "Discuss literature in a book club setting. Practice literary vocabulary and expressing analysis.", category: "Entertainment & Culture"),

        // EMERGENCY & SPECIAL
        Scenario(id: "emergency", title: "Emergency Situation", instruction: "Handle an emergency. Practice urgent communication, describing situations clearly, and asking for help.", category: "Emergency & Special"),
        Scenario(id: "lost", title: "Lost - Asking for Help", instruction: "Ask for help when lost. Practice location vocabulary and understanding directions.", category: "Emergency & Special"),
        Scenario(id: "complaint", title: "Making a Complaint", instruction: "Make a formal complaint about a product or service. Practice formal register and expressing dissatisfaction politely.", category: "Emergency & Special"),

        // HOBBIES & INTERESTS
        Scenario(id: "sports", title: "Talking About Sports", instruction: "Discuss sports, teams, and games. Practice sports vocabulary and expressing enthusiasm.", category: "Hobbies & Interests"),
        Scenario(id: "gardening", title: "Gardening and Plants", instruction: "Discuss gardening and plant care. Practice nature vocabulary and giving instructions.", category: "Hobbies & Interests"),
        Scenario(id: "photography", title: "Photography Hobby", instruction: "Discuss photography techniques and equipment. Practice technical vocabulary and expressing creativity.", category: "Hobbies & Interests"),
        Scenario(id: "music", title: "Playing Music / Instruments", instruction: "Discuss playing musical instruments. Practice music vocabulary and talking about practice routines.", category: "Hobbies & Interests"),

        // TECHNOLOGY & MODERN LIFE
        Scenario(id: "tech_support", title: "Technical Support Call", instruction: "Describe technical problems and follow troubleshooting steps. Practice technology vocabulary.", category: "Technology & Modern Life"),
        Scenario(id: "social_media", title: "Social Media Discussion", instruction: "Discuss social media and online life. Practice modern technology vocabulary.", category: "Technology & Modern Life"),

        // CUSTOMS & CULTURE
        Scenario(id: "customs", title: "Cultural Exchange", instruction: "Discuss cultural differences and customs. Practice comparing cultures and expressing curiosity.", category: "Customs & Culture"),
        Scenario(id: "holidays", title: "Holiday Traditions", instruction: "Discuss holiday traditions and celebrations. Practice cultural vocabulary and past tense narration.", category: "Customs & Culture"),

        // NATURE & OUTDOORS
        Scenario(id: "hiking", title: "Planning a Hike", instruction: "Plan an outdoor adventure. Practice nature vocabulary and making plans together.", category: "Nature & Outdoors"),
        Scenario(id: "beach", title: "Day at the Beach", instruction: "Spend a day at the beach. Practice beach vocabulary and casual conversation.", category: "Nature & Outdoors"),
        Scenario(id: "weather", title: "Discussing Weather", instruction: "Talk about weather and forecasts. Practice weather vocabulary and making small talk.", category: "Nature & Outdoors")
    ]

    static func getScenario(byId id: String) -> Scenario? {
        return scenarios.first { $0.id == id }
    }

    static func getScenariosByCategory(_ category: String) -> [Scenario] {
        return scenarios.filter { $0.category == category }
    }
}
