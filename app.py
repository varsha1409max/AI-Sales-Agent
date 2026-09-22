from flask import Flask, request, jsonify
from flask_cors import CORS
from products import products
import re

app = Flask(__name__)
CORS(app)


# =========================
# CUSTOMER DATA
# =========================

customer = {
    "name": "",
    "phone": "",
    "budget": "",
    "product": "",
    "purpose": "",
    "interested": False,
    "status": "New Lead"
}


# =========================
# LEADS
# =========================

leads = []


# =========================
# RECOMMENDATION FUNCTION
# =========================

def get_recommendations(product_type="", purpose="", budget=""):

    filtered_products = products.copy()

    # Product type filtering
    if product_type:
        filtered_products = [
            product
            for product in filtered_products
            if product_type.lower() in product["category"].lower()
        ]

    # Purpose filtering
    if purpose:

        purpose_keywords = {
            "study": ["students"],
            "college": ["students"],
            "coding": ["students", "work", "professional"],
            "programming": ["students", "work", "professional"],
            "work": ["work", "professional"],
            "office": ["work", "professional"],
            "professional": ["professional", "work"],
            "gaming": ["gaming"],
            "entertainment": ["gaming", "professional"],
            "photography": ["professional"]
        }

        keywords = purpose_keywords.get(
            purpose.lower(),
            []
        )

        if keywords:

            filtered_products = [
                product
                for product in filtered_products
                if product["purpose"].lower() in keywords
            ]

    # Budget filtering
    if budget:

        try:

            budget_value = int(budget)

            filtered_products = [
                product
                for product in filtered_products
                if product["price"] <= budget_value
            ]

        except (ValueError, TypeError):

            pass

    # Sort by lowest price
    filtered_products.sort(
        key=lambda product: product["price"]
    )

    return filtered_products


# =========================
# CREATE LEAD
# =========================

def create_lead():

    lead = {
        "name": customer["name"],
        "phone": customer["phone"],
        "product": customer["product"],
        "purpose": customer["purpose"],
        "budget": customer["budget"],
        "status": customer["status"]
    }

    # Avoid duplicate lead with same phone number
    for existing_lead in leads:

        if (
            existing_lead["phone"]
            and existing_lead["phone"] == lead["phone"]
        ):

            existing_lead.update(lead)

            return

    leads.append(lead)


# =========================
# HOME
# =========================

@app.route("/")
def home():

    return "AI Sales Agent Backend is Running!"


# =========================
# HEALTH
# =========================

@app.route("/health")
def health():

    return jsonify({
        "status": "Backend is healthy"
    })


# =========================
# CUSTOMER
# =========================

@app.route("/customer", methods=["GET"])
def get_customer():

    return jsonify(customer)


# =========================
# LEADS
# =========================

@app.route("/leads", methods=["GET"])
def get_leads():

    return jsonify(leads)


# =========================
# PRODUCTS
# =========================

@app.route("/products", methods=["GET"])
def get_products():

    return jsonify(products)


# =========================
# RESET CUSTOMER
# =========================

@app.route("/customer/reset", methods=["POST"])
def reset_customer():

    customer["name"] = ""
    customer["phone"] = ""
    customer["budget"] = ""
    customer["product"] = ""
    customer["purpose"] = ""
    customer["interested"] = False
    customer["status"] = "New Lead"

    return jsonify({
        "message": "Customer data has been reset.",
        "customer": customer
    })


# =========================
# CHAT
# =========================

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    if not data:

        return jsonify({
            "response": "Please enter a message."
        })

    message = data.get("message", "").strip()

    if not message:

        return jsonify({
            "response": "Please enter a message."
        })

    message_lower = message.lower()


    # ==================================================
    # 1. PHONE NUMBER
    # ==================================================

    phone_phrases = [
        "my phone is",
        "my number is",
        "phone number is",
        "my mobile is",
        "mobile number is"
    ]

    phone_detected = any(
        phrase in message_lower
        for phrase in phone_phrases
    )

    if phone_detected:

        phone_number = ""

        for phrase in phone_phrases:

            if phrase in message_lower:

                start_position = (
                    message_lower.find(phrase)
                    + len(phrase)
                )

                phone_number = message[
                    start_position:
                ].strip()

                break

        # Keep only digits
        phone_number = "".join(
            character
            for character in phone_number
            if character.isdigit()
        )

        customer["phone"] = phone_number

        if customer["interested"]:

            customer["status"] = "Ready to Buy"

        else:

            customer["status"] = "Contact Details Received"

        # Save customer as a lead
        create_lead()

        return jsonify({
            "response":
                f"Thank you, "
                f"{customer['name'] if customer['name'] else 'customer'}! "
                "Your phone number has been received. "
                "Our sales team can contact you with more information."
        })


    # ==================================================
    # 2. BUYING INTEREST
    # ==================================================

    if (
        "i want to buy" in message_lower
        or "want to buy" in message_lower
        or "i would like to buy" in message_lower
        or "interested in buying" in message_lower
        or message_lower == "buy"
    ):

        customer["interested"] = True
        customer["status"] = "Interested"

        return jsonify({
            "response":
                "Great! You are interested in buying. "
                "Please provide your name and phone number "
                "so our sales team can contact you."
        })


    # ==================================================
    # 3. NAME
    # ==================================================

    if "my name is" in message_lower:

        phrase = "my name is"

        start_position = (
            message_lower.find(phrase)
            + len(phrase)
        )

        name = message[
            start_position:
        ].strip()

        customer["name"] = name

        return jsonify({
            "response":
                f"Nice to meet you, {name}! "
                "Please provide your phone number."
        })


    # ==================================================
    # 4. PRODUCT
    # ==================================================

    if (
        "laptop" in message_lower
        or "computer" in message_lower
        or "mobile" in message_lower
        or "headphone" in message_lower
    ):

        if (
            "laptop" in message_lower
            or "computer" in message_lower
        ):

            customer["product"] = "Laptop"

        elif "mobile" in message_lower:

            customer["product"] = "Mobile"

        elif "headphone" in message_lower:

            customer["product"] = "Headphones"

        return jsonify({
            "response":
                f"I can help you with "
                f"{customer['product']} products. "
                "Please tell me your purpose and budget."
        })


    # ==================================================
    # 5. PURPOSE
    # ==================================================

    purpose = ""

    if (
        "study" in message_lower
        or "student" in message_lower
        or "college" in message_lower
        or "class" in message_lower
    ):

        purpose = "Study"

    elif (
        "coding" in message_lower
        or "programming" in message_lower
        or "developer" in message_lower
    ):

        purpose = "Coding"

    elif (
        "gaming" in message_lower
        or "game" in message_lower
    ):

        purpose = "Gaming"

    elif (
        "office" in message_lower
        or "work" in message_lower
    ):

        purpose = "Work"

    elif "professional" in message_lower:

        purpose = "Professional"

    elif (
        "movie" in message_lower
        or "movies" in message_lower
        or "entertainment" in message_lower
        or "music" in message_lower
    ):

        purpose = "Entertainment"

    elif (
        "photography" in message_lower
        or "camera" in message_lower
    ):

        purpose = "Photography"


    if purpose:

        customer["purpose"] = purpose

        return jsonify({
            "response":
                f"Great! I understand that you need "
                f"a product mainly for {purpose}. "
                "Now tell me your budget."
        })


    # ==================================================
    # 6. BUDGET
    # ==================================================

    budget_words = (
        "budget" in message_lower
        or "₹" in message
        or "rs." in message_lower
        or "rs " in message_lower
        or "rupees" in message_lower
    )

    if budget_words:

        numbers = re.findall(
            r"\d+",
            message
        )

        if numbers:

            budget_value = int(numbers[-1])

            customer["budget"] = budget_value

            recommendations = get_recommendations(
                customer["product"],
                customer["purpose"],
                budget_value
            )

            if recommendations:

                response = (
                    "Based on your requirement and budget, "
                    "I recommend:\n\n"
                )

                for index, product in enumerate(
                    recommendations[:3],
                    start=1
                ):

                    response += (
                        f"{index}. {product['name']} - "
                        f"₹{product['price']}\n"
                        f"Purpose: {product['purpose']}\n"
                        f"Features: "
                        f"{', '.join(product['features'])}\n\n"
                    )

                response += (
                    "Would you like to know more about "
                    "one of these products? "
                    'If you are interested in buying, '
                    'type "I want to buy".'
                )

                return jsonify({
                    "response": response
                })

            return jsonify({
                "response":
                    "I could not find a product within "
                    "your budget. Please try a higher budget."
            })


    # ==================================================
    # 7. DEFAULT
    # ==================================================

    return jsonify({
        "response":
            "I can help you find the right product. "
            "Please tell me what product you need, "
            "your purpose, or your budget."
    })


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":

    app.run(debug=True)