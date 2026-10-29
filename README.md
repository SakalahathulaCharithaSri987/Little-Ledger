# 🌸 Little Ledger

**Your money. Your diary. Your progress.**

Little Ledger is a simple, aesthetic, and beginner-friendly personal finance tracker designed to help users record daily income and expenses, monitor their remaining balance, and understand their spending habits through clear bar charts.

Built with HTML, CSS, and JavaScript, Little Ledger combines a minimal interface with practical money-tracking features.

## ✨ Features

### 📊 Dashboard
- View total income and total expenses.
- Track your remaining balance.
- Enter monthly income and savings amounts.
- Visualize daily expenses using a bar chart.
- Compare monthly spending using a monthly expense chart.
- View financial information for different months.

### 💸 Expense Tracking
- Add expenses with a name, amount, and date.
- View saved expenses in a transaction table.
- Edit or delete existing expenses.
- Calculate total expenses automatically.
- Track daily and monthly spending.

### 💰 Income Tracking
- Record income by source, amount, and date.
- View income entries in a structured table.
- Edit or delete income records.
- Monitor recorded income totals.

### 📈 Visual Reports
- Daily expense bar chart.
- Monthly expense comparison chart.
- Automatic chart updates when transactions change.
- Clear visual representation of spending habits.

### 💾 Data Persistence
- Automatically save transactions using browser `localStorage`.
- Keep records available after refreshing or reopening the website in the same browser.
- Store financial records locally without requiring a backend.

### 🎨 Aesthetic User Interface
Designed with a soft, minimal color palette:

| Color | Hex Code | Usage |
|---|---|---|
| Dusty Rose | `#D8A2A2` | Highlights and accents |
| Soft Pink | `#FFDCDC` | Secondary backgrounds |
| Cream Yellow | `#FFF9D6` | Dashboard sections |
| Sage Green | `#8EA66B` | Positive indicators |

The responsive layout is designed to be simple, clean, and easy to navigate on desktop and mobile devices.

## 🛠️ Technologies Used

- **HTML5** — Website structure
- **CSS3** — Styling and responsive layout
- **JavaScript** — Functionality and financial calculations
- **localStorage** — Local browser data persistence
- **JavaScript charting or CSS-based charts** — Visualizing expenses

## 📁 Project Structure

```text
Little-Ledger/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

## 🚀 Getting Started

No complicated installation is required.

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL.

### 2. Open the project folder

```bash
cd Little-Ledger
```

### 3. Run the website

Open `index.html` in your browser.

Alternatively, use the Live Server extension in Visual Studio Code for a convenient local development experience.

### 4. Start tracking your money

1. Open the Dashboard.
2. Enter your monthly income, savings, and starting balance as needed.
3. Navigate to Expenses to record daily spending.
4. Navigate to Income to record money received.
5. Return to the Dashboard to review your charts and remaining balance.

## 🧮 Financial Calculations

Little Ledger uses the following basic calculation:

**Remaining Balance = Starting Balance + Total Income − Total Expenses**

Monthly income totals entered manually should remain separate from individual income transactions to prevent double-counting.

Savings are tracked separately from ordinary expenses. The dashboard should clearly distinguish money recorded as saved from the balance remaining in the spending account.

All financial values are entered by the user. No salary, starting balance, or savings target is assumed.

## 🔐 Data Storage and Privacy

Little Ledger uses browser `localStorage` to persist financial records.

- Data remains available in the same browser and device after refreshing the website.
- Data is not automatically synchronized between browsers or devices.
- Clearing browser storage may permanently remove saved records.
- Because there is no backend, there is no automatic cloud backup.

**Important:** Export or back up your financial records before clearing browser data or moving to another device if backup functionality is available in your version.

## 📱 Responsive Design

Little Ledger aims to provide a smooth experience across:
- Desktop computers
- Laptops
- Tablets
- Mobile phones

The layout adapts to smaller screens to keep transaction entry and financial summaries easy to use.

## 🎯 Project Goal

The goal of Little Ledger is to make everyday money management simple and accessible.

Instead of complicated financial tools, it focuses on three essential sections:

- **Dashboard** — Understand your financial position.
- **Expenses** — Record and review daily spending.
- **Income** — Track money received.

The objective is to help users become more aware of their spending habits through consistent tracking and simple visual insights.

## 🔮 Future Improvements

Possible enhancements include:

- Export transactions to CSV.
- Import and restore financial backups.
- Add category-based spending analysis.
- Introduce optional spending limits.
- Add more detailed monthly comparisons.
- Enable secure cloud synchronization across devices.

## 🤝 Contributing

Suggestions and improvements are welcome. Feel free to fork the repository, make changes, and submit a pull request.

## 📄 License

This project is available for personal learning and development. Add an appropriate open-source license if you intend to distribute it under specific reuse terms.

---

**Made with 🌸 for simpler money management.**

*Little Ledger — Small steps toward better financial habits.*
