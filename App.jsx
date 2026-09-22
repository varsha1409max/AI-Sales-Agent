import { useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:5000";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [products, setProducts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadLeads();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Product loading error:", error);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch(`${API_URL}/leads`);
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error("Lead loading error:", error);
    }
  };

  const sendMessage = async (customMessage = null) => {
    const text = customMessage || message;

    if (!text.trim()) {
      return;
    }

    setChat((oldChat) => [
      ...oldChat,
      {
        sender: "You",
        message: text,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      setChat((oldChat) => [
        ...oldChat,
        {
          sender: "AI Sales Agent",
          message: data.response,
        },
      ]);

      loadLeads();
    } catch (error) {
      setChat((oldChat) => [
        ...oldChat,
        {
          sender: "AI Sales Agent",
          message:
            "Backend connection failed. Please check the Flask server.",
        },
      ]);
    }

    setLoading(false);
  };

  const askAboutProduct = (product) => {
    setCurrentPage("assistant");

    sendMessage(
      `I am interested in ${product.name}. Tell me about this product and why it would be suitable for me.`
    );
  };

  const askRecommendation = () => {
    sendMessage(
      "I need a product recommendation. Please ask me about my purpose and budget."
    );
  };

  const askBudgetRecommendation = () => {
    sendMessage(
      "My budget is limited. Please recommend the best product within my budget."
    );
  };

  const newCustomer = async () => {
    try {
      await fetch(`${API_URL}/customer/reset`, {
        method: "POST",
      });

      setChat([]);
      setMessage("");
      setLeads([]);

      alert("New customer session started.");
    } catch (error) {
      alert("Could not start a new customer session.");
    }
  };

  const exportCustomerData = () => {
    if (leads.length === 0) {
      alert("No lead data available to export.");
      return;
    }

    const headers = [
      "Name",
      "Phone",
      "Product",
      "Purpose",
      "Budget",
      "Status",
    ];

    const rows = leads.map((lead) => [
      lead.name || "",
      lead.phone || "",
      lead.product || "",
      lead.purpose || "",
      lead.budget || "",
      lead.status || "",
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "customer_leads.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const analytics = useMemo(() => {
    const totalCustomers = leads.length;

    const interestedCustomers = leads.filter(
      (lead) =>
        lead.status === "Interested" ||
        lead.status === "Ready to Buy"
    ).length;

    const budgets = leads
      .map((lead) => Number(lead.budget))
      .filter((budget) => budget > 0);

    const averageBudget =
      budgets.length > 0
        ? Math.round(
            budgets.reduce(
              (total, budget) => total + budget,
              0
            ) / budgets.length
          )
        : 0;

    const productCounts = {};

    leads.forEach((lead) => {
      if (lead.product) {
        productCounts[lead.product] =
          (productCounts[lead.product] || 0) + 1;
      }
    });

    const purposeCounts = {};

    leads.forEach((lead) => {
      if (lead.purpose) {
        purposeCounts[lead.purpose] =
          (purposeCounts[lead.purpose] || 0) + 1;
      }
    });

    const statusCounts = {};

    leads.forEach((lead) => {
      if (lead.status) {
        statusCounts[lead.status] =
          (statusCounts[lead.status] || 0) + 1;
      }
    });

    const mostPopularProduct =
      Object.keys(productCounts).length > 0
        ? Object.keys(productCounts).sort(
            (a, b) =>
              productCounts[b] - productCounts[a]
          )[0]
        : "No data";

    return {
      totalCustomers,
      interestedCustomers,
      averageBudget,
      mostPopularProduct,
      productCounts,
      purposeCounts,
      statusCounts,
    };
  }, [leads]);

  return (
    <div style={appStyle}>
      <header style={navbarStyle}>
        <div style={navInnerStyle}>
          <div
            style={{ cursor: "pointer" }}
            onClick={() => setCurrentPage("home")}
          >
            <div style={logoStyle}>AI Sales</div>

            <div style={logoSubStyle}>
              Customer Analytics
            </div>
          </div>

          <nav style={navStyle}>
            <NavButton
              text="Home"
              active={currentPage === "home"}
              onClick={() => setCurrentPage("home")}
            />

            <NavButton
              text="Products"
              active={currentPage === "products"}
              onClick={() => setCurrentPage("products")}
            />

            <NavButton
              text="AI Assistant"
              active={currentPage === "assistant"}
              onClick={() =>
                setCurrentPage("assistant")
              }
            />

            <NavButton
              text="Analytics"
              active={currentPage === "analytics"}
              onClick={() =>
                setCurrentPage("analytics")
              }
            />

            <NavButton
              text="Leads"
              active={currentPage === "leads"}
              onClick={() => setCurrentPage("leads")}
            />
          </nav>
        </div>
      </header>

      <main style={mainStyle}>
        {currentPage === "home" && (
          <>
            <section style={heroStyle}>
              <div style={{ maxWidth: "720px" }}>
                <div style={badgeStyle}>
                  DATA ANALYTICS + AI
                </div>

                <h1 style={heroTitleStyle}>
                  Turn Customer Data Into
                  <br />

                  <span style={{ color: "#60a5fa" }}>
                    Business Insights
                  </span>
                </h1>

                <p style={heroTextStyle}>
                  An intelligent sales platform that
                  collects customer information,
                  recommends products, manages leads
                  and transforms customer data into
                  useful analytics.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "25px",
                  }}
                >
                  <button
                    onClick={() =>
                      setCurrentPage("assistant")
                    }
                    style={primaryButtonStyle}
                  >
                    Start AI Assistant →
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage("analytics")
                    }
                    style={secondaryButtonStyle}
                  >
                    View Analytics
                  </button>
                </div>
              </div>

              <div style={heroDashboardStyle}>
                <div style={miniChartTitle}>
                  Customer Overview
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                    gap: "10px",
                    height: "150px",
                    marginTop: "20px",
                  }}
                >
                  {[45, 75, 55, 90, 65, 100, 80].map(
                    (height, index) => (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          height: `${height}%`,
                          background:
                            index % 2 === 0
                              ? "#60a5fa"
                              : "#818cf8",
                          borderRadius:
                            "6px 6px 0 0",
                        }}
                      />
                    )
                  )}
                </div>

                <div style={miniStatsStyle}>
                  <div>
                    <strong>
                      {analytics.totalCustomers}
                    </strong>

                    <small>Customers</small>
                  </div>

                  <div>
                    <strong>
                      {analytics.interestedCustomers}
                    </strong>

                    <small>Interested</small>
                  </div>
                </div>
              </div>
            </section>

            <section style={sectionStyle}>
              <SectionHeading
                title="What This Project Does"
                subtitle="A complete AI-powered customer analytics solution"
              />

              <div style={cardGridStyle}>
                <FeatureCard
                  icon="🤖"
                  title="AI Assistant"
                  text="Understands customer requirements and recommends suitable products."
                />

                <FeatureCard
                  icon="📊"
                  title="Data Analytics"
                  text="Converts customer information into meaningful business insights."
                />

                <FeatureCard
                  icon="👥"
                  title="Lead Management"
                  text="Collects and manages customer information for sales follow-up."
                />

                <FeatureCard
                  icon="💰"
                  title="Budget Analysis"
                  text="Analyzes customer budgets and recommends products accordingly."
                />
              </div>
            </section>

            <section
              style={{
                ...sectionStyle,
                background: "#eef2ff",
              }}
            >
              <SectionHeading
                title="Built For Data-Driven Decisions"
                subtitle="The system connects customer interaction with analytics."
              />

              <div style={processGridStyle}>
                <ProcessCard
                  number="01"
                  title="Collect"
                  text="Capture customer requirements"
                />

                <ProcessCard
                  number="02"
                  title="Analyze"
                  text="Study customer and product data"
                />

                <ProcessCard
                  number="03"
                  title="Understand"
                  text="Find useful patterns and trends"
                />

                <ProcessCard
                  number="04"
                  title="Decide"
                  text="Support better business decisions"
                />
              </div>
            </section>
          </>
        )}

        {currentPage === "products" && (
          <section>
            <PageHeader
              badge="PRODUCT CATALOG"
              title="Explore Products"
              subtitle="Browse products and use the AI assistant to understand which product fits the customer requirement."
            />

            <div style={cardGridStyle}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={productCardStyle}
                >
                  <div style={productIconStyle}>
                    💻
                  </div>

                  <div style={categoryStyle}>
                    {product.category}
                  </div>

                  <h2 style={{ marginBottom: "10px" }}>
                    {product.name}
                  </h2>

                  <div style={priceStyle}>
                    ₹
                    {product.price.toLocaleString(
                      "en-IN"
                    )}
                  </div>

                  <p>
                    <strong>Best for:</strong>{" "}
                    {product.purpose}
                  </p>

                  <ul style={{ lineHeight: "1.8" }}>
                    {product.features?.map(
                      (feature, index) => (
                        <li key={index}>
                          {feature}
                        </li>
                      )
                    )}
                  </ul>

                  <button
                    onClick={() =>
                      askAboutProduct(product)
                    }
                    style={{
                      ...primaryButtonStyle,
                      width: "100%",
                      marginTop: "15px",
                    }}
                  >
                    Ask AI About Product
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentPage === "assistant" && (
          <section>
            <PageHeader
              badge="AI SALES ASSISTANT"
              title="Talk To Your AI Sales Agent"
              subtitle="Tell the agent what you need. It will analyze your purpose and budget and recommend suitable products."
            />

            <div style={assistantLayoutStyle}>
              <div style={assistantSideStyle}>
                <h3>Quick Actions</h3>

                <button
                  onClick={askRecommendation}
                  style={quickButtonStyle}
                >
                  🎯 Get Recommendation
                </button>

                <button
                  onClick={askBudgetRecommendation}
                  style={quickButtonStyle}
                >
                  💰 Find Within Budget
                </button>

                <button
                  onClick={newCustomer}
                  style={{
                    ...quickButtonStyle,
                    background: "#dcfce7",
                    color: "#166534",
                  }}
                >
                  + New Customer
                </button>

                <div style={helpBoxStyle}>
                  <strong>Try saying:</strong>

                  <p>
                    "I need a laptop for college"
                  </p>

                  <p>
                    "My budget is 50000"
                  </p>

                  <p>"I want to buy"</p>
                </div>
              </div>

              <div style={chatContainerStyle}>
                <div style={chatHeaderStyle}>
                  <div style={onlineDotStyle}></div>

                  <div>
                    <strong>AI Sales Agent</strong>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Online • Ready to help
                    </div>
                  </div>
                </div>

                <div style={chatAreaStyle}>
                  {chat.length === 0 && (
                    <div style={welcomeChatStyle}>
                      <div style={largeIconStyle}>
                        🤖
                      </div>

                      <h2>
                        Hello! I'm your AI Sales Agent
                      </h2>

                      <p>
                        Tell me what product you are
                        looking for and I will help you.
                      </p>

                      <div style={exampleBoxStyle}>
                        Example:{" "}
                        <strong>
                          I need a laptop for study
                        </strong>
                      </div>
                    </div>
                  )}

                  {chat.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "18px",
                        display: "flex",
                        justifyContent:
                          item.sender === "You"
                            ? "flex-end"
                            : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "13px 16px",
                          borderRadius: "14px",
                          background:
                            item.sender === "You"
                              ? "#2563eb"
                              : "#eef2ff",
                          color:
                            item.sender === "You"
                              ? "white"
                              : "#111827",
                          whiteSpace: "pre-line",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "11px",
                            marginBottom: "5px",
                            opacity: 0.7,
                          }}
                        >
                          {item.sender}
                        </div>

                        {item.message}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div style={typingStyle}>
                      AI Sales Agent is thinking...
                    </div>
                  )}
                </div>

                <div style={chatInputStyle}>
                  <input
                    type="text"
                    value={message}
                    placeholder="Type your requirement..."
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        sendMessage();
                      }
                    }}
                    style={inputStyle}
                  />

                  <button
                    onClick={() => sendMessage()}
                    style={primaryButtonStyle}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentPage === "analytics" && (
          <section>
            <PageHeader
              badge="DATA ANALYTICS"
              title="Customer Analytics Dashboard"
              subtitle="Analyze customer behavior, product interest, budgets and lead status."
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={exportCustomerData}
                style={{
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                📥 Export Customer Data
              </button>
            </div>

            <div style={kpiGridStyle}>
              <KpiCard
                icon="👥"
                title="Total Customers"
                value={analytics.totalCustomers}
                subtitle="Total leads collected"
              />

              <KpiCard
                icon="🔥"
                title="Interested Customers"
                value={analytics.interestedCustomers}
                subtitle="Interested or ready to buy"
              />

              <KpiCard
                icon="💰"
                title="Average Budget"
                value={
                  analytics.averageBudget
                    ? `₹${analytics.averageBudget.toLocaleString(
                        "en-IN"
                      )}`
                    : "₹0"
                }
                subtitle="Average customer budget"
              />

              <KpiCard
                icon="🏆"
                title="Popular Product"
                value={analytics.mostPopularProduct}
                subtitle="Highest customer interest"
              />
            </div>

            <div style={analyticsGridStyle}>
              <ChartCard
                title="Customers by Product"
                subtitle="Product demand"
              >
                <BarChart
                  data={analytics.productCounts}
                />
              </ChartCard>

              <ChartCard
                title="Customers by Purpose"
                subtitle="Customer requirements"
              >
                <BarChart
                  data={analytics.purposeCounts}
                />
              </ChartCard>
            </div>

            <div style={analyticsGridStyle}>
              <ChartCard
                title="Lead Status"
                subtitle="Current customer journey"
              >
                <BarChart
                  data={analytics.statusCounts}
                />
              </ChartCard>

              <ChartCard
                title="Business Insights"
                subtitle="What the data tells us"
              >
                <div style={insightsStyle}>
                  <Insight
                    icon="📌"
                    text={
                      analytics.totalCustomers > 0
                        ? `${analytics.totalCustomers} customer lead(s) have been collected.`
                        : "No customer data is available yet."
                    }
                  />

                  <Insight
                    icon="🎯"
                    text={
                      analytics.mostPopularProduct !==
                      "No data"
                        ? `${analytics.mostPopularProduct} currently has the highest customer interest.`
                        : "Product interest will appear after customers interact with the system."
                    }
                  />

                  <Insight
                    icon="💰"
                    text={
                      analytics.averageBudget > 0
                        ? `The average customer budget is ₹${analytics.averageBudget.toLocaleString(
                            "en-IN"
                          )}.`
                        : "Budget insights will appear after customer data is collected."
                    }
                  />

                  <Insight
                    icon="📈"
                    text="These insights can support product planning and sales decisions."
                  />
                </div>
              </ChartCard>
            </div>

            <section style={sectionStyle}>
              <SectionHeading
                title="Data Analyst Workflow"
                subtitle="How this project demonstrates analytics skills"
              />

              <div style={processGridStyle}>
                <ProcessCard
                  number="01"
                  title="Data Collection"
                  text="Collect customer and product information."
                />

                <ProcessCard
                  number="02"
                  title="Data Cleaning"
                  text="Organize customer records and numerical values."
                />

                <ProcessCard
                  number="03"
                  title="Data Analysis"
                  text="Analyze products, purposes, budgets and statuses."
                />

                <ProcessCard
                  number="04"
                  title="Visualization"
                  text="Present important information using dashboards."
                />
              </div>
            </section>
          </section>
        )}

        {currentPage === "leads" && (
          <section>
            <PageHeader
              badge="CUSTOMER DATA"
              title="Lead Management"
              subtitle="View and manage customer information collected by the AI Sales Agent."
            />

            <section style={tableContainerStyle}>
              <div style={tableTopStyle}>
                <div>
                  <h2 style={{ margin: 0 }}>
                    Customer Leads
                  </h2>

                  <p
                    style={{
                      color: "#6b7280",
                      marginBottom: 0,
                    }}
                  >
                    {leads.length} lead(s) available
                  </p>
                </div>

                <button
                  onClick={loadLeads}
                  style={secondaryDarkButtonStyle}
                >
                  ↻ Refresh
                </button>
              </div>

              {leads.length === 0 ? (
                <div style={emptyStateStyle}>
                  <div style={largeIconStyle}>
                    📊
                  </div>

                  <h3>No leads available</h3>

                  <p>
                    Start a customer conversation to
                    generate lead data.
                  </p>

                  <button
                    onClick={() =>
                      setCurrentPage("assistant")
                    }
                    style={primaryButtonStyle}
                  >
                    Start AI Assistant
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>
                          Name
                        </th>

                        <th style={tableHeaderStyle}>
                          Phone
                        </th>

                        <th style={tableHeaderStyle}>
                          Product
                        </th>

                        <th style={tableHeaderStyle}>
                          Purpose
                        </th>

                        <th style={tableHeaderStyle}>
                          Budget
                        </th>

                        <th style={tableHeaderStyle}>
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {leads.map((lead, index) => (
                        <tr key={index}>
                          <td style={tableCellStyle}>
                            {lead.name || "-"}
                          </td>

                          <td style={tableCellStyle}>
                            {lead.phone || "-"}
                          </td>

                          <td style={tableCellStyle}>
                            {lead.product || "-"}
                          </td>

                          <td style={tableCellStyle}>
                            {lead.purpose || "-"}
                          </td>

                          <td style={tableCellStyle}>
                            {lead.budget
                              ? `₹${Number(
                                  lead.budget
                                ).toLocaleString(
                                  "en-IN"
                                )}`
                              : "-"}
                          </td>

                          <td style={tableCellStyle}>
                            <span
                              style={{
                                ...statusBadgeStyle,
                                background:
                                  lead.status ===
                                  "Ready to Buy"
                                    ? "#dcfce7"
                                    : "#eef2ff",
                                color:
                                  lead.status ===
                                  "Ready to Buy"
                                    ? "#166534"
                                    : "#3730a3",
                              }}
                            >
                              {lead.status || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      <footer style={footerStyle}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          AI Sales & Customer Analytics
        </div>

        <p style={{ color: "#9ca3af" }}>
          React.js • Python Flask • Data Analytics
        </p>

        <p
          style={{
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          Intelligent Product Recommendation &
          Customer Analytics System
        </p>
      </footer>
    </div>
  );
}

/* COMPONENTS */

function NavButton({ text, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...navButtonBaseStyle,
        background: active
          ? "#2563eb"
          : "transparent",
        border: active
          ? "1px solid #2563eb"
          : "1px solid #374151",
      }}
    >
      {text}
    </button>
  );
}

function PageHeader({ badge, title, subtitle }) {
  return (
    <div style={pageHeaderStyle}>
      <div style={badgeStyle}>{badge}</div>

      <h1 style={pageTitleStyle}>{title}</h1>

      <p style={pageSubtitleStyle}>{subtitle}</p>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "25px" }}>
      <h2 style={{ marginBottom: "8px" }}>
        {title}
      </h2>

      <p style={{ color: "#6b7280" }}>
        {subtitle}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div style={featureCardStyle}>
      <div style={featureIconStyle}>{icon}</div>

      <h3>{title}</h3>

      <p
        style={{
          color: "#6b7280",
          lineHeight: "1.6",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function ProcessCard({ number, title, text }) {
  return (
    <div style={processCardStyle}>
      <div style={processNumberStyle}>{number}</div>

      <h3>{title}</h3>

      <p style={{ color: "#6b7280" }}>{text}</p>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiIconStyle}>{icon}</div>

      <div>
        <div style={kpiTitleStyle}>{title}</div>

        <div style={kpiValueStyle}>{value}</div>

        <div style={kpiSubtitleStyle}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={chartCardStyle}>
      <h2 style={{ marginBottom: "5px" }}>
        {title}
      </h2>

      <p
        style={{
          color: "#6b7280",
          marginTop: 0,
        }}
      >
        {subtitle}
      </p>

      {children}
    </div>
  );
}

function BarChart({ data }) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div style={noChartDataStyle}>
        No data available yet
      </div>
    );
  }

  const maxValue = Math.max(
    ...entries.map((entry) => entry[1])
  );

  return (
    <div style={{ marginTop: "20px" }}>
      {entries.map(([label, value]) => {
        const percentage =
          maxValue > 0
            ? (value / maxValue) * 100
            : 0;

        return (
          <div
            key={label}
            style={{ marginBottom: "18px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
                fontSize: "14px",
              }}
            >
              <strong>{label}</strong>

              <span>{value}</span>
            </div>

            <div style={barBackgroundStyle}>
              <div
                style={{
                  width: `${percentage}%`,
                  height: "10px",
                  background:
                    "linear-gradient(90deg, #2563eb, #818cf8)",
                  borderRadius: "10px",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Insight({ icon, text }) {
  return (
    <div style={insightItemStyle}>
      <span style={{ fontSize: "22px" }}>
        {icon}
      </span>

      <span>{text}</span>
    </div>
  );
}

/* STYLES */

const appStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#111827",
};

const navbarStyle = {
  background: "#111827",
  color: "white",
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.15)",
};

const navInnerStyle = {
  maxWidth: "1250px",
  margin: "auto",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap",
};

const logoStyle = {
  fontSize: "22px",
  fontWeight: "bold",
};

const logoSubStyle = {
  fontSize: "11px",
  color: "#9ca3af",
  marginTop: "3px",
};

const navStyle = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
};

const navButtonBaseStyle = {
  color: "white",
  padding: "9px 13px",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "bold",
};

const mainStyle = {
  maxWidth: "1250px",
  margin: "auto",
  padding: "35px 20px",
};

const heroStyle = {
  background:
    "linear-gradient(135deg, #111827 0%, #1e3a8a 100%)",
  color: "white",
  padding: "65px 45px",
  borderRadius: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "40px",
  flexWrap: "wrap",
  marginBottom: "35px",
  boxShadow:
    "0 15px 40px rgba(37,99,235,0.18)",
};

const badgeStyle = {
  display: "inline-block",
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "7px 12px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "bold",
  letterSpacing: "1px",
  marginBottom: "12px",
};

const heroTitleStyle = {
  fontSize: "46px",
  lineHeight: "1.15",
  margin: "5px 0 18px",
};

const heroTextStyle = {
  color: "#dbeafe",
  fontSize: "17px",
  lineHeight: "1.7",
};

const heroDashboardStyle = {
  background: "rgba(255,255,255,0.1)",
  border:
    "1px solid rgba(255,255,255,0.15)",
  borderRadius: "18px",
  padding: "25px",
  width: "320px",
};

const miniChartTitle = {
  color: "#e5e7eb",
  fontWeight: "bold",
};

const miniStatsStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "20px",
};

const primaryButtonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 19px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  background: "rgba(255,255,255,0.1)",
  color: "white",
  border:
    "1px solid rgba(255,255,255,0.3)",
  padding: "12px 19px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const sectionStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "18px",
  marginBottom: "30px",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.05)",
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "20px",
};

const featureCardStyle = {
  padding: "25px",
  border: "1px solid #e5e7eb",
  borderRadius: "15px",
  background: "#ffffff",
};

const featureIconStyle = {
  fontSize: "32px",
  marginBottom: "10px",
};

const processGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "18px",
};

const processCardStyle = {
  background: "white",
  padding: "22px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
};

const processNumberStyle = {
  color: "#2563eb",
  fontWeight: "bold",
  fontSize: "13px",
};

const pageHeaderStyle = {
  background:
    "linear-gradient(135deg, #ffffff, #eef2ff)",
  padding: "35px",
  borderRadius: "20px",
  marginBottom: "25px",
  border: "1px solid #e0e7ff",
};

const pageTitleStyle = {
  fontSize: "36px",
  margin: "5px 0 10px",
};

const pageSubtitleStyle = {
  color: "#6b7280",
  fontSize: "16px",
  maxWidth: "750px",
  lineHeight: "1.6",
};

const productCardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "17px",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.05)",
};

const productIconStyle = {
  width: "55px",
  height: "55px",
  borderRadius: "14px",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "27px",
};

const categoryStyle = {
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "bold",
  marginTop: "15px",
};

const priceStyle = {
  fontSize: "25px",
  fontWeight: "bold",
  color: "#111827",
  margin: "12px 0",
};

const assistantLayoutStyle = {
  display: "grid",
  gridTemplateColumns:
    "280px minmax(0, 1fr)",
  gap: "20px",
};

const assistantSideStyle = {
  background: "white",
  padding: "22px",
  borderRadius: "16px",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.05)",
  height: "fit-content",
};

const quickButtonStyle = {
  width: "100%",
  border: "none",
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "13px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  marginBottom: "10px",
  textAlign: "left",
};

const helpBoxStyle = {
  background: "#f8fafc",
  padding: "15px",
  borderRadius: "10px",
  marginTop: "15px",
  fontSize: "13px",
  lineHeight: "1.5",
};

const chatContainerStyle = {
  background: "white",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.05)",
};

const chatHeaderStyle = {
  padding: "17px 20px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const onlineDotStyle = {
  width: "10px",
  height: "10px",
  background: "#22c55e",
  borderRadius: "50%",
};

const chatAreaStyle = {
  height: "430px",
  overflowY: "auto",
  padding: "20px",
  background: "#f8fafc",
};

const welcomeChatStyle = {
  textAlign: "center",
  maxWidth: "450px",
  margin: "70px auto",
  color: "#4b5563",
};

const largeIconStyle = {
  fontSize: "45px",
};

const exampleBoxStyle = {
  background: "#eef2ff",
  padding: "12px",
  borderRadius: "8px",
  color: "#3730a3",
  marginTop: "15px",
};

const typingStyle = {
  color: "#6b7280",
  fontSize: "13px",
};

const chatInputStyle = {
  padding: "15px",
  display: "flex",
  gap: "10px",
  borderTop: "1px solid #e5e7eb",
};

const inputStyle = {
  flex: 1,
  padding: "13px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "25px",
};

const kpiCardStyle = {
  background: "white",
  padding: "22px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const kpiIconStyle = {
  width: "52px",
  height: "52px",
  borderRadius: "13px",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "25px",
};

const kpiTitleStyle = {
  color: "#6b7280",
  fontSize: "13px",
};

const kpiValueStyle = {
  fontSize: "25px",
  fontWeight: "bold",
  margin: "5px 0",
};

const kpiSubtitleStyle = {
  color: "#9ca3af",
  fontSize: "11px",
};

const analyticsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(350px, 1fr))",
  gap: "20px",
  marginBottom: "20px",
};

const chartCardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "17px",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const barBackgroundStyle = {
  width: "100%",
  height: "10px",
  background: "#e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
};

const noChartDataStyle = {
  padding: "50px 10px",
  textAlign: "center",
  color: "#9ca3af",
};

const insightsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "20px",
};

const insightItemStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  padding: "14px",
  background: "#f8fafc",
  borderRadius: "10px",
  fontSize: "14px",
  lineHeight: "1.5",
};

const tableContainerStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "17px",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.05)",
};

const tableTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  gap: "15px",
  flexWrap: "wrap",
};

const secondaryDarkButtonStyle = {
  background: "#374151",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "55px 20px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "750px",
};

const tableHeaderStyle = {
  padding: "14px",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  textAlign: "left",
  fontSize: "13px",
};

const tableCellStyle = {
  padding: "14px",
  border: "1px solid #e5e7eb",
  fontSize: "14px",
};

const statusBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
};

const footerStyle = {
  background: "#111827",
  color: "white",
  textAlign: "center",
  padding: "35px 20px",
  marginTop: "40px",
};

export default App;