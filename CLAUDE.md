# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A serverless Todo List application with a React frontend and Node.js Express backend, deployed on AWS. The backend runs on AWS Lambda using Docker containers with DynamoDB for data persistence.

## Development Commands

### Local Development (Recommended for active development)

Start local DynamoDB:

```bash
docker compose -f docker-compose-dynamodb.yml up -d
```

Backend (with hot reload):

```bash
cd backend
npm install
cp .env.example .env  # Only needed first time
npm run dev           # Starts on http://localhost:3001
```

Frontend (with hot reload):

```bash
cd frontend
npm install
npm run dev           # Starts on http://localhost:5173
```

Initialize local DynamoDB table:

```bash
cd backend
npx ts-node scripts/init-db.ts
```

### Production Preview Mode

Run full stack in containers (no hot reload):

```bash
docker compose -f docker-compose-build.yml up -d --build
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:3001>

### Backend Commands

```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Run compiled JavaScript
npm run type-check   # Check TypeScript without emitting files
```

### Frontend Commands

```bash
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production (type-check + build)
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
```

## Architecture

### Backend Structure

The backend follows a layered architecture:

- **Entry Point**: `src/index.ts` - Starts the Express server
- **Application Setup**: `src/app.ts` - Configures Express app, middleware, and routes
- **Routes**: `src/routes/todos.ts` - Defines API endpoints for todo operations
- **Controllers**: `src/controllers/todoController.ts` - Handles request/response logic
- **Database Layer**:
  - `src/db/dynamodb.ts` - DynamoDB client configuration
  - `src/db/todos.ts` - Database operations for todos
- **Middleware**:
  - `src/middleware/errorHandler.ts` - Global error handling
  - `src/middleware/validation.ts` - Request validation
- **Types**: `src/types/index.ts` - Shared TypeScript interfaces

### API Endpoints

All routes are prefixed with `/todos`:

- `GET /todos` - Get all todos
- `POST /todos` - Create a new todo (validates title required)
- `PUT /todos/:id` - Update a todo
- `DELETE /todos/:id` - Delete a todo
- `POST /todos/:id/toggle` - Toggle todo completed status
- `GET /health` - Health check endpoint

### Frontend Structure

React 19 with Vite, TypeScript, and Tailwind CSS 4:

- **Entry Point**: `src/main.tsx`
- **Root Component**: `src/App.tsx`
- **Pages**: `src/pages/TodosPage.tsx` - Main todo list page
- **Components**:
  - `src/components/TodoList.tsx` - Renders list of todos
  - `src/components/TodoItem.tsx` - Individual todo item
  - `src/components/AddTodo.tsx` - Form to add new todos
- **API Layer**: `src/services/api.ts` - Axios-based API client
- **Types**: `src/types/index.ts` - Shared TypeScript interfaces

### Environment Configuration

Backend uses environment variables defined in `.env` (copy from `.env.example`):

- `DYNAMODB_ENDPOINT` - Set to `http://localhost:8000` for local development
- `AWS_REGION` - AWS region for DynamoDB
- `TABLE_NAME` - DynamoDB table name (default: "Todos")
- `PORT` - Backend server port (default: 3001)

Frontend uses Vite environment variables:

- `VITE_API_URL` - Backend API URL (defaults to <http://localhost:3001>)

### DynamoDB Schema

Table: `Todos` (configurable via `TABLE_NAME` env var)

- Partition Key: `id` (String) - UUID generated with `uuid` package
- Attributes:
  - `title` (String, required)
  - `description` (String, optional)
  - `completed` (Boolean)
  - `createdAt` (String, ISO 8601 timestamp)
  - `updatedAt` (String, ISO 8601 timestamp)

### AWS Lambda Deployment

The backend runs on AWS Lambda using a Docker container:

- Uses `aws-lambda-adapter` to run Express apps on Lambda without code changes
- Container image stored in Amazon ECR
- API Gateway provides HTTP endpoint
- Lambda has IAM permissions to access DynamoDB

## Infrastructure

Infrastructure is managed with Terraform and Terragrunt in `infrastructure/`:

**Modules**:

- `api-gateway/` - HTTP API Gateway with Lambda integration
- `lambda/` - Lambda function configuration
- `dynamodb/` - DynamoDB table with on-demand billing
- `ecr/` - Container registry for Lambda images
- `s3/` - Static website hosting for frontend
- `iam/` - IAM roles and policies

**Environments**: `infrastructure/environments/dev/`

Deploy infrastructure:

```bash
cd infrastructure/environments/dev
terragrunt init
terragrunt apply
```

Deploy backend to Lambda:

```bash
./deploy_backend.sh  # Run from project root
```

## Key Implementation Details

### Database Client Initialization

The DynamoDB client (`src/db/dynamodb.ts`) automatically detects local vs AWS environments:

- If `DYNAMODB_ENDPOINT` env var is set, uses local DynamoDB with dummy credentials
- Otherwise connects to AWS DynamoDB using AWS SDK default credential chain

### Request Validation

All create/update requests are validated using middleware in `src/middleware/validation.ts`:

- Creates require `title` (string)
- Updates accept optional `title`, `description`, `completed`

### Error Handling

Global error handler (`src/middleware/errorHandler.ts`) catches all errors and returns consistent JSON responses with appropriate HTTP status codes.

### Type Safety

Both frontend and backend share identical TypeScript interfaces for `Todo`, `CreateTodoRequest`, and `UpdateTodoRequest` to ensure type consistency across the stack.

## AI Integration Implementation Plan (Option 2)

### Feature Overview

Implement an AI-powered task analysis feature that provides intelligent insights about the user's todo list. The feature will analyze all pending todos and generate:

- A concise summary of current workload
- Priority recommendations based on task context
- Actionable insights about task organization
- Optional: Smart categorization or grouping suggestions of the to

### Technical Architecture

**Frontend → Backend → LLM Provider → Response Flow**

1. User clicks "AI Analyze" button in the UI
2. Frontend sends all todos to new backend endpoint
3. Backend formats todos into a structured prompt
4. Backend calls OpenRouter API (or similar free LLM provider)
5. LLM returns analysis/summary
6. Backend processes and returns formatted response
7. Frontend displays AI insights in a user-friendly modal/panel

### Backend Implementation

#### New Files to Create

**`src/services/aiService.ts`** - LLM integration service:

- Function to call OpenRouter API (or Groq/Together AI free tier)
- Prompt engineering for task analysis
- Error handling for API failures
- Rate limiting logic (optional but recommended)

**`src/controllers/aiController.ts`** - AI endpoint handlers:

- `analyzeTodos()` - Main handler for AI analysis
- Input: Array of todos from request body
- Output: AI-generated insights/summary

#### Files to Modify

**`src/routes/todos.ts`** - Add new route:

- `POST /todos/analyze` - Trigger AI analysis

**`src/types/index.ts`** - Add new interfaces:

```typescript
interface AIAnalysisRequest {
  todos: Todo[];
}

interface AIAnalysisResponse {
  summary: string;
  insights: string[];
  prioritySuggestions?: string[];
}
```

**`backend/.env.example`** and **`backend/.env`** - Add:

- `OPENROUTER_API_KEY` - API key for LLM provider
- `AI_MODEL` - Model identifier (e.g., "meta-llama/llama-3.2-3b-instruct:free")
- `AI_MAX_TOKENS` - Response length limit (default: 500)

**`backend/package.json`** - No new dependencies needed (use built-in `fetch` in Node 18+)

### Frontend Implementation

#### New Files to Create

**`src/components/AIAnalysis.tsx`** - AI analysis panel:

- Button to trigger analysis
- Loading state with spinner
- Display area for AI insights
- Error handling UI

**`src/services/ai.ts`** - AI API client:

```typescript
export const analyzeWithAI = async (todos: Todo[]): Promise<AIAnalysisResponse> => {
  const response = await api.post<AIAnalysisResponse>('/analyze', { todos });
  return response.data;
};
```

#### Files to Modify

**`src/pages/TodosPage.tsx`** or **`src/components/TodoList.tsx`**:

- Import and render `AIAnalysis` component
- Pass current todos list as prop

**`src/types/index.ts`** - Add matching interfaces:

- Same `AIAnalysisResponse` interface as backend

### LLM Provider Setup

**Recommended: OpenRouter Free Models**

- Create account at <https://openrouter.ai>
- Get API key from dashboard
- Use free models like, in order of preference:
  - `z-ai/glm-4.5-air:free`
  - `nvidia/nemotron-nano-12b-v2-vl:free`
  - `x-ai/grok-4.1-fast:free`

### Prompt Engineering Strategy

Create effective prompts in `src/services/aiService.ts`:

```typescript
const systemPrompt = `You are a task management assistant. Analyze the user's todo list and provide:
1. A brief summary of their workload (1-2 sentences)
2. 2-3 actionable insights about task organization
3. Priority recommendations if tasks seem urgent

Keep responses concise and actionable. Format as JSON.`;

const userPrompt = `Analyze these todos:
${todos.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n')}

Provide analysis in this JSON format:
{
  "summary": "Brief workload summary",
  "insights": ["insight 1", "insight 2"],
  "prioritySuggestions": ["suggestion 1", "suggestion 2"]
}`;
```

### Error Handling & Edge Cases

**Backend considerations**:

- Handle API timeouts (set 10-second timeout)
- Return user-friendly errors when LLM fails
- Handle empty todo lists gracefully
- Validate LLM response format (ensure valid JSON)
- Add try-catch around all LLM calls

**Frontend considerations**:

- Show loading state during analysis (can take 2-5 seconds)
- Display error messages if analysis fails
- Disable button while request is in progress
- Handle case where user has no todos
- Consider adding a "Try again" option on failure

### Testing Strategy

**Manual testing checklist**:

1. Test with empty todo list
2. Test with only completed todos
3. Test with mix of completed/pending todos
4. Test with todos containing descriptions
5. Test LLM API failure (invalid API key)
6. Test timeout scenario
7. Verify response renders correctly in UI

**Docker Compose testing**:

- Ensure new environment variables are passed to container
- Test in `docker-compose-build.yml` mode before submission

### Performance Considerations

- LLM API calls can take 2-10 seconds
- Consider adding request caching (same todos = same analysis for 5 minutes)
- Limit analysis to reasonable todo counts (e.g., max 100 todos)
- Show progress indicator during API call
- Consider debouncing if analysis is triggered automatically

### Security Considerations

- Never send API keys to frontend
- Validate todo data before sending to LLM
- Sanitize LLM responses before rendering (prevent XSS if LLM returns HTML)
- Consider rate limiting on backend endpoint (prevent abuse)
- Add CORS protection (already configured)

### Implementation Steps

1. **Setup LLM Provider** (15 min)
   - Create OpenRouter account
   - Get API key
   - Test API with curl

2. **Backend Implementation** (60 min)
   - Create `aiService.ts` with LLM integration
   - Create `aiController.ts` with analysis handler
   - Add route to `todos.ts`
   - Add environment variables
   - Test with Postman/curl

3. **Frontend Implementation** (45 min)
   - Create `AIAnalysis.tsx` component
   - Create `ai.ts` API service
   - Integrate into `TodosPage.tsx`
   - Style with Tailwind CSS

4. **Testing & Polish** (30 min)
   - Test all edge cases
   - Improve error messages
   - Verify Docker build works
   - Update README with new feature

5. **Documentation** (15 min)
   - Update README with AI feature description
   - Document required environment variables
   - Add screenshots if time permits

### Expected User Experience

1. User has several pending todos in their list
2. User clicks "✨ Analyze with AI" button
3. Button shows loading spinner, becomes disabled
4. After 3-5 seconds, a panel slides in/appears below
5. Panel shows:
   - "Your Workload: You have 5 pending tasks focused on frontend development and documentation."
   - "Insights: Consider tackling the authentication feature first as it blocks other work."
   - "Priority: Start with 'Implement login' since other tasks depend on it."
6. User can dismiss the panel and try again if todos change

### Stretch Goals (if time permits)

- Add "Ask AI a question" feature where users can ask about specific todos
- Implement smart categorization (AI groups todos into categories or tags)
- Add AI-powered todo suggestions based on current todos
- Persist AI analysis results to avoid redundant API calls (e.g. add a cache)
- Add animation/transitions for better UX
