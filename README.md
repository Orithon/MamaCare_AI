# MamaCare AI

## Overview

MamaCare AI is an AI-powered maternal healthcare platform designed to support pregnant women through intelligent health risk prediction,
simplified medical report interpretation, and accessible maternal health education. 
By combining natural language processing and voice technology, 
the platform aims to improve maternal health awareness and encourage informed healthcare decisions.

---

## Features

* **Maternal Risk Prediction** – Predicts pregnancy-related health risks such as preeclampsia, anemia, hypertension, and gestational diabetes using maternal health data.
* **Medical Report Interpreter** – Translates complex medical reports into clear, easy-to-understand explanations.
* **Multilingual Voice Assistant** – Answers maternal health questions through both voice and text interactions.
* **User Dashboard** – Provides access to user profiles, prediction history, uploaded reports, and personalized recommendations.

---

## Objectives

The primary goals of MamaCare AI are to:

* Detect maternal health risks early.
* Improve understanding of medical reports.
* Provide accessible maternal health education.
* Support informed healthcare decisions.
* Connect Patients to Healthcare providers
* Assist Providers to manage patients

---

## Technology Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Frontend        | Next.js, CSS                           |
| Backend         | FastAPI                                |
| Database        | Mongo DB                               |
| NLP             | Gemini API                             |
| Speech Services | Speech-to-Text and Text-to-Speech APIs |

---

## Functional Requirements

* User registration and authentication
* Profile management
* AI-powered maternal risk prediction
* Medical report upload and processing
* Simplified report generation
* Voice-based maternal health assistance
* Prediction history management
* Secure data storage and management

---

## Project Structure

```text
MamaCare-AI/
├── frontend/
├── backend/
└── README.md
```

---

## Installation

1. Clone the repository.

```bash
git clone https://github.com/DATICANcompetitionUI/MamaCare.git
cd MamaCare
```

2. Create and activate a virtual environment.

```bash
cd backend
python -m venv venv
```

3. Install the required dependencies.

```bash
pip install -r requirements.txt
```

4. Start the backend server.

```bash
uvicorn main:app --reload --port:8000
```

5. Start the frontend server.

 ``` bash
  cd frontend
  pnpm dev
```
   


---

## Future Enhancements

* Support for additional local languages.
* Improved AI prediction accuracy.
* Mobile application.
* Appointment scheduling with healthcare providers.
* Real-time notifications and reminders.
* Add GPU for custom text to speech model.
* Automatic connection of high risk patients to available providers
* Hospital integration

---

## Contributing

Contributions are welcome. Please fork the repository, create a feature branch, commit your changes, and submit a pull request for review.

---

## License

This project is intended for educational and research purposes. Choose an appropriate open-source license (such as the MIT License) before public release.

---

## Team

MamaCare AI is a collaborative project involving:

* Frontend Development
* Backend Development
* AI/Machine Learning Engineering
