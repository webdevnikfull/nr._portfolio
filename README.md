# 🎯 BMI Calculator - Health & Fitness App & QA Portfolio

![BMI Calculator App Interface](banner.png)

> **About the project:** BMI Calculator is a modern, responsive web application designed to compute and analyze Body Mass Index with precision. Built with a focus on clean user interface (UI) and robust input validation, this repository serves as a core component of my QA portfolio. It demonstrates both structured frontend implementation and a professional approach to quality assurance (Shift-Left QA) through rigorous unit testing, boundary value analysis, and comprehensive test documentation.

[Open app ↗](https://webdevnikfull.github.io/bmi-calculator/)

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Unit Testing](https://img.shields.io/badge/Unit_Testing-C21325?style=for-the-badge&logo=jest&logoColor=white)

## ✨ Core Features

The application is engineered to deliver fast, accurate health metrics alongside an intuitive user experience:
* **Instant BMI Calculation:** Computes Body Mass Index dynamically based on height and weight inputs.
* **Health Categorization:** Clearly classifies results into standard WHO categories (Underweight, Normal weight, Overweight, Obesity) with visual indicators.
* **Unit Flexibility:** Supports seamless switching between metric (kg/cm) and imperial (lbs/in) measurement systems.
* **Input Validation & Error Handling:** Prevents invalid entries (negative numbers, extreme values, empty fields) with clear user feedback.
* **Responsive Design:** Optimized layout that adapts smoothly to mobile devices, tablets, and desktops.

## 🧪 QA Approach & Test Structure

As a QA Engineer, I focused heavily on calculation accuracy, boundary value analysis (BVA), and error handling within this project:

* **QA Documentation:** Identified edge cases, boundary conditions, positive/negative test scenarios, and bug reports are systematically detailed in the `QA-REPORT.md` file.
* **Unit Tests:** Core calculation algorithms and metric conversion logic are rigorously verified using automated tests in the `tests/calculator.test.cjs` file.
* **Logic Separation:** The architecture clearly isolates the mathematical calculation and validation logic (`calculator.js`) from the DOM rendering layer (`app.js`), ensuring high testability and clean code maintenance.

## 📂 Repository Architecture

* `index.html` / `styles.css` – Semantic structure and modern styling of the user interface.
* `app.js` – Event listeners, DOM manipulation, and dynamic result rendering.
* `calculator.js` – Core business logic, formula implementation, and data validation.
* `tests/calculator.test.cjs` – Automated test suite verifying calculation accuracy and edge cases.
* `QA-REPORT.md` – Comprehensive manual testing results, exploratory notes, and requirements verification.

## 🚀 Running the Local Environment

To run the application and execute automated tests locally, follow these steps:

### 1. Running the UI application
Clone the repository and open `index.html` in any modern web browser (using the *Live Server* extension in your code editor is recommended).

### 2. Running automated tests
Ensure you have Node.js installed. Open your terminal in the project's root directory and run:
```bash
npm install
npm test
