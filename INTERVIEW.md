# Fullstack Todo List - Interview Assignment

## Objective
The goal of this assignment is to assess your ability to implement full-stack features using AI Agentic coding tools. This assignment is time-boxed to approximately **3 hours** as a guideline.

## Context
You are provided with a working Todo List application consisting of:
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, DynamoDB (via AWS SDK)
- **Infrastructure**: Docker, Terragrunt (for AWS deployment)

## Tasks

Please choose **ONE** of the following two options to complete.

### Option 1: Full Stack Features (Authentication & User Data)
Focus on core full-stack skills: authentication, authorization, and data modeling.

#### 1. Authentication
Implement a simple authentication system.
- Users should be able to **Register** and **Login**.
- You can use JWT (JSON Web Tokens) or any other method you prefer.
- Protect the Todo List routes so only authenticated users can access them.

#### 2. User-Specific Todo List
Modify the existing Todo List functionality to be user-specific.
- When a user logs in, they should only see their own todos.
- Creating, updating, and deleting todos should only affect the current user's data.
- You will need to modify the backend schema/logic to associate todos with user IDs.

---

### Option 2: AI Integration
Focus on integrating LLMs and creative feature implementation.

#### AI Summarizer (or similar feature)
Implement a feature that uses AI to provide value to the user. This is an open-ended task to show your creativity.
- **Example**: A "Summarize" button that uses an LLM to generate a summary of the user's pending tasks.
- **Example**: Smart categorization of todos.
- **Note**: Please do **not** mock the AI response. We recommend using **[OpenRouter's free models](https://openrouter.ai/models?fmt=table&input_modalities=text&max_price=0&output_modalities=text)** (or any other free provider) to implement a real integration. The focus is on the integration and UX.

## Constraints & Guidelines
- **Time Guideline**: ~3 Hours. This is a guideline to ensure you don't spend too much time on this assignment.
- **Tools**: You are encouraged to use AI coding assistants (like Gemini CLI or Antigravity IDE) to speed up development.
- **Quality**: Focus on clean code, proper error handling, and a good user experience.
- **Completeness**: An incomplete solution is acceptable. We want to see your understanding and ability to navigate through code and system design.

## Submission Requirements
1.  **Buildable Containerized Project**: Ensure the project can be built and run using the provided Docker Compose configuration (`docker-compose-build.yml`).
2.  **Git Repository**: Submit your code as a public Git repository (e.g., GitHub, GitLab) with a clear commit history showing your progress.
3.  **Documentation**: Update the README or provide a summary explaining your changes and how to run the new features.
4.  **AWS Deployment (Optional)**: If you are comfortable, you may deploy the application to your own AWS account and provide the URL. This is **optional** but a plus.

## Getting Started
1.  Explore the codebase to understand the current implementation.
2.  Choose your option (Option 1 or Option 2).
3.  Plan your changes (Backend schema, API routes, Frontend components).
4.  Implement the selected features.
5.  Verify your solution works as expected.

Good luck!
