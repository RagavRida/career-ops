# CareerAI - The Automated Job Search Pipeline

Built by Raghavendra Machikatla.

CareerAI is a complete SaaS pipeline that automates your job search. It scans company portals for AI-Native Builder roles, evaluates the job descriptions against your Digital Twin, generates highly tailored CVs and outreach emails using LLMs (Featherless / Gemini), and manages the entire pipeline for you.

## Features

- **Automated Pipeline**: Scans Greenhouse/Lever/Ashby for open roles
- **LLM Evaluation**: Evaluates jobs based on archetype matching
- **Custom CV Generation**: Generates pixel-perfect HTML/PDF resumes tailored for *each* role
- **Zero-Fee Payments**: Integrated UPI direct intent payments (0% fees)
- **Supabase Auth**: OAuth integration for Google and GitHub
- **AWS Amplify Hosting**: Fully ready for CI/CD deployment

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env.local` variables for Supabase and Featherless.

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
