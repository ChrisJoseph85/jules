# Types Reference

This page documents all data types used in the Jules REST API.

## Core Resources

### Session

A session represents a unit of work where Jules executes a coding task.

<ApiSchema name="Session" description="A session is a contiguous amount of work within the same context.">
  
  
  
  
  
  
  
  
  
  
  
  
</ApiSchema>

### SessionState

Enum representing the current state of a session:

| Value | Description |
|-------|-------------|
| `STATE_UNSPECIFIED` | State is unspecified |
| `QUEUED` | Session is waiting to be processed |
| `PLANNING` | Jules is creating a plan |
| `AWAITING_PLAN_APPROVAL` | Plan is ready for user approval |
| `AWAITING_USER_FEEDBACK` | Jules needs user input |
| `IN_PROGRESS` | Jules is actively working |
| `PAUSED` | Session is paused |
| `FAILED` | Session failed |
| `COMPLETED` | Session completed successfully |

### AutomationMode

Enum for session automation settings:

| Value | Description |
|-------|-------------|
| `AUTOMATION_MODE_UNSPECIFIED` | No automation (default) |
| `AUTO_CREATE_PR` | Automatically create a pull request when code changes are ready |

---

### Activity

An activity represents a single event within a session.

<ApiSchema name="Activity" description="An activity is a single unit of work within a session.">
  
  
  
  
  
  
  
  
  
  
  
  
  
</ApiSchema>

---

### Source

A source represents a connected repository.

<ApiSchema name="Source" description="An input source of data for a session.">
  
  
  
</ApiSchema>

---

## Plans

### Plan

<ApiSchema name="Plan" description="A sequence of steps that Jules will take to complete the task.">
  
  
  
</ApiSchema>

### PlanStep

<ApiSchema name="PlanStep" description="A single step in a plan.">
  
  
  
  
</ApiSchema>

---

## Artifacts

### Artifact

<ApiSchema name="Artifact" description="A single unit of data produced by an activity.">
  
  
  
</ApiSchema>

### ChangeSet

<ApiSchema name="ChangeSet" description="A set of changes to be applied to a source.">
  
  
</ApiSchema>

### GitPatch

<ApiSchema name="GitPatch" description="A patch in Git format.">
  
  
  
</ApiSchema>

### BashOutput

<ApiSchema name="BashOutput" description="Output from a bash command.">
  
  
  
</ApiSchema>

### Media

<ApiSchema name="Media" description="A media file output.">
  
  
</ApiSchema>

---

## GitHub Types

### GitHubRepo

<ApiSchema name="GitHubRepo" description="A GitHub repository.">
  
  
  
  
  
</ApiSchema>

### GitHubBranch

<ApiSchema name="GitHubBranch" description="A GitHub branch.">
  
</ApiSchema>

### GitHubRepoContext

<ApiSchema name="GitHubRepoContext" description="Context for using a GitHub repo in a session.">
  
</ApiSchema>

---

## Context Types

### SourceContext

<ApiSchema name="SourceContext" description="Context for how to use a source in a session.">
  
  
</ApiSchema>

---

## Output Types

### SessionOutput

<ApiSchema name="SessionOutput" description="An output of a session.">
  
</ApiSchema>

### PullRequest

<ApiSchema name="PullRequest" description="A pull request.">
  
  
  
</ApiSchema>

---

## Activity Event Types

### PlanGenerated

<ApiSchema name="PlanGenerated" description="A plan was generated.">
  
</ApiSchema>

### PlanApproved

<ApiSchema name="PlanApproved" description="A plan was approved.">
  
</ApiSchema>

### UserMessaged

<ApiSchema name="UserMessaged" description="The user posted a message.">
  
</ApiSchema>

### AgentMessaged

<ApiSchema name="AgentMessaged" description="Jules posted a message.">
  
</ApiSchema>

### ProgressUpdated

<ApiSchema name="ProgressUpdated" description="A progress update occurred.">
  
  
</ApiSchema>

### SessionCompleted

<ApiSchema name="SessionCompleted" description="The session completed successfully.">
  No additional properties.
</ApiSchema>

### SessionFailed

<ApiSchema name="SessionFailed" description="The session failed.">
  
</ApiSchema>

---

## Request/Response Types

### SendMessageRequest

<ApiSchema name="SendMessageRequest" description="Request to send a message to a session.">
  
</ApiSchema>

### SendMessageResponse

<ApiSchema name="SendMessageResponse" description="Response from sending a message.">
  Empty response on success.
</ApiSchema>

### ApprovePlanRequest

<ApiSchema name="ApprovePlanRequest" description="Request to approve a plan.">
  Empty request body.
</ApiSchema>

### ApprovePlanResponse

<ApiSchema name="ApprovePlanResponse" description="Response from approving a plan.">
  Empty response on success.
</ApiSchema>

### ListSessionsResponse

<ApiSchema name="ListSessionsResponse" description="Response from listing sessions.">
  
  
</ApiSchema>

### ListActivitiesResponse

<ApiSchema name="ListActivitiesResponse" description="Response from listing activities.">
  
  
</ApiSchema>

### ListSourcesResponse

<ApiSchema name="ListSourcesResponse" description="Response from listing sources.">
  
  
</ApiSchema>
