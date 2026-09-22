import pandas as pd
import os

file_path = "customer_leads.csv"

if not os.path.exists(file_path):
    print("customer_leads.csv was not found.")
    print("Please export your customer data from the Analytics page first.")
    exit()

df = pd.read_csv(file_path)

print("\n==============================")
print("AI SALES CUSTOMER ANALYTICS")
print("==============================")

print("\n1. CUSTOMER DATA")
print("------------------------------")
print(df)

print("\n2. DATASET INFORMATION")
print("------------------------------")
print("Total Customers:", len(df))
print("Total Columns:", len(df.columns))

print("\n3. DATA CLEANING")
print("------------------------------")

df = df.drop_duplicates()

df["Budget"] = pd.to_numeric(
    df["Budget"],
    errors="coerce"
)

df["Budget"] = df["Budget"].fillna(0)

df["Product"] = df["Product"].fillna("Unknown")
df["Purpose"] = df["Purpose"].fillna("Unknown")
df["Status"] = df["Status"].fillna("Unknown")

print("Duplicate rows removed.")
print("Missing values handled.")

print("\n4. KEY PERFORMANCE INDICATORS")
print("------------------------------")

total_customers = len(df)

interested_customers = len(
    df[
        df["Status"].isin(
            ["Interested", "Ready to Buy"]
        )
    ]
)

average_budget = df["Budget"].mean()

print("Total Customers:", total_customers)
print("Interested Customers:", interested_customers)
print(
    "Average Customer Budget: ₹",
    round(average_budget, 2)
)

print("\n5. PRODUCT ANALYSIS")
print("------------------------------")

product_analysis = (
    df["Product"]
    .value_counts()
)

print(product_analysis)

if not product_analysis.empty:
    most_popular_product = (
        product_analysis.idxmax()
    )

    print(
        "Most Popular Product:",
        most_popular_product
    )

print("\n6. PURPOSE ANALYSIS")
print("------------------------------")

purpose_analysis = (
    df["Purpose"]
    .value_counts()
)

print(purpose_analysis)

if not purpose_analysis.empty:
    most_common_purpose = (
        purpose_analysis.idxmax()
    )

    print(
        "Most Common Customer Purpose:",
        most_common_purpose
    )

print("\n7. LEAD STATUS ANALYSIS")
print("------------------------------")

status_analysis = (
    df["Status"]
    .value_counts()
)

print(status_analysis)

print("\n8. BUDGET ANALYSIS")
print("------------------------------")

budget_ranges = pd.cut(
    df["Budget"],
    bins=[
        -1,
        40000,
        60000,
        80000,
        float("inf")
    ],
    labels=[
        "Below ₹40K",
        "₹40K - ₹60K",
        "₹60K - ₹80K",
        "Above ₹80K"
    ]
)

print(
    budget_ranges.value_counts()
)

print("\n9. BUSINESS INSIGHTS")
print("------------------------------")

print(
    f"• The system has collected "
    f"{total_customers} customer lead(s)."
)

if not product_analysis.empty:
    print(
        f"• {most_popular_product} "
        f"is currently the most requested product."
    )

if not purpose_analysis.empty:
    print(
        f"• {most_common_purpose} "
        f"is the most common customer purpose."
    )

print(
    f"• The average customer budget is "
    f"₹{average_budget:,.2f}."
)

print(
    f"• {interested_customers} customer(s) "
    f"are interested or ready to buy."
)

print("\n==============================")
print("ANALYSIS COMPLETED")
print("==============================")