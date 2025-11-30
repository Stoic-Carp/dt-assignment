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

#### Frontend → Backend → LLM Provider → Response Flow

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

#### New Files

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

#### Files to be Updated

**`src/pages/TodosPage.tsx`** or **`src/components/TodoList.tsx`**:

- Import and render `AIAnalysis` component
- Pass current todos list as prop

**`src/types/index.ts`** - Add matching interfaces:

- Same `AIAnalysisResponse` interface as backend

### LLM Provider Setup

#### Recommended: OpenRouter Free Models

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
3. Button shows loading spinner, preferably showing the different stages of contacting the backend services.
4. After 3-5 seconds, a panel slides in/appears below
5. Panel shows:
   - "Your Workload: You have 5 pending tasks focused on frontend development and documentation."
   - "Insights: Consider tackling the authentication feature first as it blocks other work."
   - "Priority: Start with 'Implement login' since other tasks depend on it."
6. User can dismiss the panel and try again if todos change

### Stretch Goal Implementation Plan: Intelligent Task Breakdown & Suggestions

#### Feature Overview

Allow users to input a high-level goal (e.g., "Plan a weekend camping trip") and use AI to automatically generate a list of actionable sub-tasks (e.g., "Research campsites," "Check weather forecast," "Create packing list," etc.). Users can then review, edit, and selectively add the suggested sub-tasks to their todo list.

**Key Capabilities**:

- Natural language input for high-level goals
- AI-powered task breakdown into actionable sub-tasks
- Interactive UI for reviewing suggested tasks
- Ability to edit suggested tasks before adding
- Selective addition of tasks (pick and choose)
- Optional: Set descriptions and metadata for suggested tasks

#### Technical Architecture

##### Frontend → Backend → LLM → Task Creation Flow

1. User enters high-level goal in a text input field
2. User clicks "Generate Sub-tasks with AI" button
3. Frontend sends goal to new backend endpoint
4. Backend formats goal into a structured prompt for task breakdown
5. Backend calls LLM API to generate sub-tasks
6. LLM returns structured list of sub-tasks
7. Backend processes and validates response
8. Frontend displays suggested tasks in an editable, selectable list
9. User reviews, edits, and selects which tasks to add
10. Frontend sends selected/edited tasks to existing create endpoint
11. Tasks are added to the user's todo list

#### Backend Implementation

##### New Files to Create

**`src/services/taskBreakdownService.ts`** - Task breakdown LLM service:

- Function to generate sub-tasks from high-level goal
- Specialized prompt engineering for task decomposition
- JSON schema validation for LLM response
- Error handling and fallback responses
- Token limit management (prevent excessive output)

Example interface:

```typescript
export interface TaskBreakdownRequest {
  goal: string;
  context?: string; // Optional additional context
  maxTasks?: number; // Limit number of suggestions (default: 8)
}

export interface SuggestedTask {
  title: string;
  description?: string;
  estimatedPriority?: 'low' | 'medium' | 'high';
}

export interface TaskBreakdownResponse {
  goal: string;
  suggestedTasks: SuggestedTask[];
  reasoning?: string; // Optional explanation of breakdown approach
}
```

**`src/controllers/taskBreakdownController.ts`** - Breakdown endpoint handler:

- `generateTaskBreakdown()` - Main handler for generating sub-tasks
- Input validation (goal length, content filtering)
- Rate limiting per user/session (prevent abuse)
- Response formatting

##### Files to Modify

**`src/routes/todos.ts`** - Add new route:

- `POST /todos/breakdown` - Generate task breakdown from goal

**`src/types/index.ts`** - Add new interfaces:

```typescript
export interface TaskBreakdownRequest {
  goal: string;
  context?: string;
  maxTasks?: number;
}

export interface SuggestedTask {
  title: string;
  description?: string;
  estimatedPriority?: 'low' | 'medium' | 'high';
}

export interface TaskBreakdownResponse {
  goal: string;
  suggestedTasks: SuggestedTask[];
  reasoning?: string;
}
```

**`backend/.env.example`** and **`backend/.env`** - Add (if not already present):

- `OPENROUTER_API_KEY` - Shared with AI analysis feature
- `AI_MODEL` - Shared with AI analysis feature
- `TASK_BREAKDOWN_MAX_TOKENS` - Token limit for breakdown (default: 800)
- `TASK_BREAKDOWN_MAX_TASKS` - Maximum tasks to generate (default: 8)

##### Validation & Business Logic

**Input validation**:

- Goal must be 5-500 characters
- Sanitize input to prevent prompt injection
- Rate limit: max 10 requests per minute per user
- Content filtering: reject inappropriate requests

**Output validation**:

- Ensure LLM returns valid JSON
- Validate each suggested task has a title
- Limit total number of suggestions
- Sanitize task titles/descriptions

#### Frontend Implementation

##### New Files to Create

**`src/components/TaskBreakdown.tsx`** - Main task breakdown component:

- Text input for high-level goal
- Optional textarea for additional context
- "Generate Sub-tasks" button with loading state
- Error handling and display
- Integration point for TaskSuggestionsList

**`src/components/TaskSuggestionsList.tsx`** - Suggested tasks manager:

- Display list of suggested tasks
- Checkbox for each task (select/deselect)
- Inline editing for task title and description
- Priority indicator (optional)
- "Add Selected Tasks" button
- "Select All" / "Deselect All" controls
- Delete individual suggestions
- Visual feedback for edited tasks

**`src/services/taskBreakdown.ts`** - Task breakdown API client:

```typescript
export const generateTaskBreakdown = async (
  goal: string,
  context?: string,
  maxTasks?: number
): Promise<TaskBreakdownResponse> => {
  const response = await api.post<TaskBreakdownResponse>('/todos/breakdown', {
    goal,
    context,
    maxTasks
  });
  return response.data;
};
```

**`src/hooks/useTaskBreakdown.ts`** - Custom hook for task breakdown logic:

```typescript
export const useTaskBreakdown = () => {
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [editedTasks, setEditedTasks] = useState<Map<number, SuggestedTask>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBreakdown = async (goal: string, context?: string) => {
    // Implementation
  };

  const toggleTaskSelection = (index: number) => {
    // Implementation
  };

  const updateTask = (index: number, updates: Partial<SuggestedTask>) => {
    // Implementation
  };

  const addSelectedTasks = async () => {
    // Implementation: Call existing createTodo API for each selected task
  };

  return {
    suggestions,
    selectedTasks,
    editedTasks,
    isLoading,
    error,
    generateBreakdown,
    toggleTaskSelection,
    updateTask,
    addSelectedTasks,
    clearSuggestions: () => setSuggestions([])
  };
};
```

##### Files to Modify

**`src/pages/TodosPage.tsx`** - Add TaskBreakdown component:

- Import and render TaskBreakdown component
- Position above or below todo list (design choice)
- Pass refresh callback to update todo list after adding tasks
- Optional: Collapsible section for task breakdown

**`src/types/index.ts`** - Add matching interfaces:

```typescript
export interface TaskBreakdownRequest {
  goal: string;
  context?: string;
  maxTasks?: number;
}

export interface SuggestedTask {
  title: string;
  description?: string;
  estimatedPriority?: 'low' | 'medium' | 'high';
}

export interface TaskBreakdownResponse {
  goal: string;
  suggestedTasks: SuggestedTask[];
  reasoning?: string;
}
```

#### Prompt Engineering Strategy

Create effective prompts in `src/services/taskBreakdownService.ts`:

```typescript
const systemPrompt = `You are a task decomposition assistant. Break down high-level goals into specific, actionable sub-tasks.

Guidelines:
1. Generate 4-8 concrete, actionable tasks
2. Each task should be clear and specific
3. Order tasks logically (dependencies first)
4. Keep task titles concise (5-10 words)
5. Add brief descriptions for clarity
6. Suggest priority levels where applicable

Return ONLY valid JSON, no additional text.`;

const userPrompt = `Break down this goal into actionable sub-tasks:

Goal: "${goal}"
${context ? `Additional context: "${context}"` : ''}

Return JSON in this exact format:
{
  "suggestedTasks": [
    {
      "title": "Task title here",
      "description": "Brief explanation",
      "estimatedPriority": "high|medium|low"
    }
  ],
  "reasoning": "Brief explanation of breakdown approach"
}`;
```

**Example LLM Input/Output**:

Input: "Plan a weekend camping trip"

Output:

```json
{
  "suggestedTasks": [
    {
      "title": "Research and book campsite",
      "description": "Find available campsites within 2-hour drive, check amenities and reviews",
      "estimatedPriority": "high"
    },
    {
      "title": "Check weather forecast",
      "description": "Review 3-day forecast for camping location",
      "estimatedPriority": "high"
    },
    {
      "title": "Create packing list",
      "description": "List tent, sleeping bags, cooking gear, clothing, food",
      "estimatedPriority": "medium"
    },
    {
      "title": "Plan meals and buy groceries",
      "description": "Plan breakfast, lunch, dinner for 2 days, create shopping list",
      "estimatedPriority": "medium"
    },
    {
      "title": "Prepare camping equipment",
      "description": "Check tent poles, test stove, charge flashlights",
      "estimatedPriority": "medium"
    },
    {
      "title": "Plan route and activities",
      "description": "Map hiking trails, identify points of interest",
      "estimatedPriority": "low"
    }
  ],
  "reasoning": "Prioritized by time-sensitivity and dependencies: booking and weather first, then preparation tasks, finally optional activities"
}
```

#### UI/UX Design

##### TaskBreakdown Component Layout

```
┌─────────────────────────────────────────────┐
│  🎯 Break Down a Goal into Tasks            │
├─────────────────────────────────────────────┤
│  What do you want to accomplish?            │
│  ┌─────────────────────────────────────┐   │
│  │ [Text input for goal]               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Additional context (optional):             │
│  ┌─────────────────────────────────────┐   │
│  │ [Textarea]                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [✨ Generate Sub-tasks] [Loading...]      │
└─────────────────────────────────────────────┘
```

##### TaskSuggestionsList Component Layout

```
┌─────────────────────────────────────────────┐
│  Suggested Tasks for: "Plan camping trip"   │
│  [Select All] [Deselect All] [Clear]        │
├─────────────────────────────────────────────┤
│  ☑ Research and book campsite              │
│     Brief description here...               │
│     [Edit] Priority: High                   │
├─────────────────────────────────────────────┤
│  ☑ Check weather forecast                  │
│     Brief description...                    │
│     [Edit] Priority: High                   │
├─────────────────────────────────────────────┤
│  ☐ Create packing list                     │
│     Brief description...                    │
│     [Edit] Priority: Medium                 │
├─────────────────────────────────────────────┤
│  [Add 2 Selected Tasks to List]            │
└─────────────────────────────────────────────┘
```

#### Error Handling & Edge Cases

**Backend considerations**:

- Handle empty/invalid goals (too short, too long)
- API timeout handling (15-second timeout)
- LLM returns invalid JSON → return fallback suggestions
- LLM returns no tasks → provide helpful error message
- Rate limiting exceeded → return 429 status with retry-after
- Content filtering for inappropriate requests

**Frontend considerations**:

- Disable "Generate" button while loading (prevent double submission)
- Show loading stages: "Contacting AI..." → "Generating tasks..." → "Almost done..."
- Display error messages clearly with retry option
- Handle case where LLM returns 0 suggestions
- Validate edited tasks before submission (title required)
- Prevent adding tasks with empty titles
- Show confirmation after tasks added successfully
- Handle network errors gracefully

**Edge cases to test**:

1. Empty goal input
2. Very long goal (>500 characters)
3. Goal in different languages
4. Vague goals ("do stuff")
5. Very specific goals ("buy milk") - might generate single task
6. Goals that could be misinterpreted
7. Editing all fields of a suggested task
8. Selecting/deselecting rapidly
9. Adding tasks while todo list is empty
10. Network interruption during generation
11. User navigates away during loading

#### Testing Strategy

##### Backend Unit Tests

**`tests/services/taskBreakdownService.test.ts`**:

- Test successful task breakdown generation
- Test handling of LLM API errors
- Test JSON parsing and validation
- Test input sanitization
- Test token limit enforcement
- Test max tasks limit enforcement

**`tests/controllers/taskBreakdownController.test.ts`**:

- Test valid request handling
- Test request validation (goal length, format)
- Test error response formatting
- Test rate limiting logic

##### Backend Integration Tests

**`tests/integration/taskBreakdown.test.ts`**:

- Test end-to-end breakdown API call
- Test integration with LLM service
- Test error handling with real API errors
- Test timeout scenarios
- Test concurrent requests

##### Frontend Unit Tests

**`tests/components/TaskBreakdown.test.tsx`**:

- Test form submission with valid input
- Test loading state display
- Test error state display
- Test input validation

**`tests/components/TaskSuggestionsList.test.tsx`**:

- Test task selection/deselection
- Test task editing
- Test "Select All" / "Deselect All"
- Test "Add Selected Tasks" button state
- Test empty suggestions state

**`tests/hooks/useTaskBreakdown.test.ts`**:

- Test generateBreakdown function
- Test task selection toggle
- Test task update logic
- Test addSelectedTasks function
- Test state management

##### Frontend Integration Tests

**`tests/integration/TaskBreakdownFlow.test.tsx`**:

- Test complete flow: input → generate → edit → add
- Test API error handling
- Test loading states
- Test task addition to todo list

##### Manual Testing Checklist

1. **Happy Path**:
   - Enter goal "Plan a birthday party"
   - Generate suggestions
   - Review suggested tasks
   - Edit one task
   - Select 3 tasks
   - Add to todo list
   - Verify tasks appear in main list

2. **Edge Cases**:
   - Empty goal input (should show validation)
   - Very vague goal "do things"
   - Very specific goal "buy eggs"
   - Goal with special characters
   - Goal in different language
   - Edit task to have empty title (should prevent)

3. **Error Scenarios**:
   - Invalid API key (simulate in .env)
   - Network timeout
   - LLM returns invalid JSON
   - LLM returns empty array

4. **UI/UX Testing**:
   - Loading states display correctly
   - Error messages are clear
   - Buttons disable appropriately
   - Task editing UI is intuitive
   - Mobile responsive design
   - Keyboard navigation works

#### Performance Considerations

- **LLM API latency**: 3-8 seconds typical
- **Optimization strategies**:
  - Show progress indicators with stages
  - Implement client-side caching (same goal = same suggestions for 1 hour)
  - Debounce "Generate" button (prevent rapid clicks)
  - Stream LLM response if API supports (show tasks as they're generated)
  - Limit concurrent requests per user

- **Token optimization**:
  - Use smaller, faster models for task breakdown
  - Limit response length with max_tokens parameter
  - Use structured output format (JSON mode if available)

#### Security Considerations

- **API key protection**: Never expose in frontend
- **Input sanitization**:
  - Escape special characters
  - Prevent prompt injection attacks
  - Limit input length (500 chars max)
- **Output sanitization**:
  - Sanitize LLM-generated text before rendering
  - Prevent XSS if LLM returns HTML/scripts
  - Validate all fields before database insertion
- **Rate limiting**:
  - 10 requests per minute per user
  - 100 requests per hour per user
  - Track by IP or session ID
- **Content filtering**:
  - Reject requests with inappropriate content
  - Log and monitor abuse patterns

#### Implementation Steps

1. **Backend Foundation** (60 min)
   - Create `taskBreakdownService.ts` with LLM integration
   - Implement prompt engineering for task breakdown
   - Add JSON schema validation
   - Create `taskBreakdownController.ts`
   - Add `/todos/breakdown` route
   - Update TypeScript interfaces
   - Write unit tests for service and controller

2. **Backend Testing** (30 min)
   - Write integration tests
   - Test with real LLM API
   - Test error scenarios
   - Add rate limiting logic
   - Test input validation

3. **Frontend Core Components** (90 min)
   - Create `TaskBreakdown.tsx` component
   - Create `TaskSuggestionsList.tsx` component
   - Implement `useTaskBreakdown` hook
   - Create `taskBreakdown.ts` API service
   - Add TypeScript interfaces
   - Integrate into TodosPage
   - Style with Tailwind CSS

4. **Frontend Editing & Selection** (45 min)
   - Implement task editing UI
   - Add selection checkboxes
   - Implement "Select All" / "Deselect All"
   - Add inline editing capability
   - Implement task deletion from suggestions
   - Add validation for edited tasks

5. **Integration & Task Addition** (30 min)
   - Connect to existing createTodo API
   - Implement batch task creation
   - Add success/error feedback
   - Refresh todo list after adding
   - Clear suggestions after successful add

6. **Frontend Testing** (45 min)
   - Write component unit tests
   - Write hook tests
   - Write integration tests
   - Manual testing of all flows
   - Test error scenarios
   - Test mobile responsiveness

7. **Polish & UX** (30 min)
   - Improve loading states with stages
   - Add animations/transitions
   - Improve error messages
   - Add keyboard shortcuts
   - Add tooltips/help text
   - Responsive design refinements

8. **Docker & Documentation** (30 min)
   - Test in docker-compose-build.yml
   - Update README with feature description
   - Document new API endpoints
   - Update environment variable docs
   - Add usage examples

9. **Final Testing** (30 min)
   - End-to-end testing in Docker
   - Test all edge cases
   - Performance testing
   - Security testing
   - Cross-browser testing

#### Expected User Experience

##### Scenario 1: New User - Weekend Project

1. User opens todo app, sees "Break Down a Goal into Tasks" section
2. User types: "Organize my garage this weekend"
3. User clicks "✨ Generate Sub-tasks"
4. Loading indicator shows: "Contacting AI..." → "Analyzing your goal..." → "Creating suggestions..."
5. After 4 seconds, 6 suggested tasks appear:
   - ☑ "Sort items into keep/donate/trash piles"
   - ☑ "Take photos and list items to donate online"
   - ☑ "Clean and sweep garage floor"
   - ☑ "Install wall hooks and shelving"
   - ☑ "Organize tools in toolbox or pegboard"
   - ☑ "Label storage bins and containers"
6. User unchecks "Install wall hooks" (not planning that)
7. User clicks "Edit" on "Sort items..." and changes to "Sort items - focus on old sports equipment"
8. User clicks "Add 5 Selected Tasks to List"
9. Success message: "5 tasks added to your list!"
10. Tasks appear in main todo list
11. Suggestions clear automatically

##### Scenario 2: Existing User - Work Project

1. User types: "Prepare Q4 sales presentation for board meeting"
2. Adds context: "Needs revenue charts, competitor analysis, and forward projections"
3. Clicks "Generate Sub-tasks"
4. Receives 7 specific suggestions with priorities
5. Edits 2 tasks to be more specific
6. Selects 6 out of 7 suggestions
7. Adds to todo list
8. Begins working through tasks systematically

##### Scenario 3: Error Handling

1. User enters very vague goal: "stuff"
2. Backend validates and returns: "Please provide a more specific goal (at least 5 characters)"
3. User enters longer goal: "Plan team building activities"
4. API timeout occurs
5. Error message: "Generation took too long. Please try again with a simpler goal."
6. User clicks "Try Again"
7. Works successfully on second attempt

#### Integration with Existing AI Analysis Feature

**Shared Infrastructure**:

- Use same OpenRouter API key and configuration
- Reuse error handling patterns
- Share rate limiting logic
- Common LLM response validation utilities

**Differentiation**:

- AI Analysis: Reactive (analyze existing todos)
- Task Breakdown: Proactive (create new todos)
- Different prompts and response formats
- Different UI components and placement

**Code Reuse Opportunities**:

```typescript
// Shared utilities in src/services/llmUtils.ts
export const callLLM = async (prompt: string, systemPrompt: string, options?: LLMOptions) => {
  // Common LLM API call logic
};

export const validateLLMResponse = (response: unknown, schema: JSONSchema) => {
  // Common JSON validation
};

export const sanitizeInput = (input: string): string => {
  // Common input sanitization
};
```

#### Success Metrics

**Functional Success**:

- Task breakdown completes in <8 seconds 95% of time
- LLM generates 4-8 relevant tasks for 90% of goals
- Users successfully add at least 1 suggested task 80% of time
- Error rate <5% under normal conditions

**User Experience Success**:

- Users understand how to use feature without instructions
- Average time from goal input to tasks added: <30 seconds
- Users edit <30% of suggested tasks (indicating good quality)
- Users return to use feature multiple times

**Technical Success**:

- All unit tests pass
- All integration tests pass
- No security vulnerabilities
- API response time within limits
- Rate limiting prevents abuse
- Works in Docker production mode
