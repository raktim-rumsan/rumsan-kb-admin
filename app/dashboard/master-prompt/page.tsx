"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  usePromptsQuery,
  useUpdatePromptsMutation,
} from "@/queries/promptsQuery";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isLoading: boolean;
  isPending: boolean;
  onReset: () => void;
  onSave: () => void;
  isSaveDisabled: boolean;
}

function PromptEditor({
  value,
  onChange,
  placeholder,
  isLoading,
  isPending,
  onReset,
  onSave,
  isSaveDisabled,
}: PromptEditorProps) {
  return (
    <>
      <div className="bg-muted/50 rounded-lg border border-border p-4 flex-1 min-h-0 overflow-hidden shrink-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full font-mono text-sm resize-none border-0 p-0 focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
          placeholder={isLoading ? "Loading..." : placeholder}
          disabled={isLoading}
        />
      </div>

      <div className="mt-6 flex items-center justify-end shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-3xs"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2  ml-4 w-3xs"
          onClick={onSave}
          disabled={isSaveDisabled || isPending}
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  );
}

export default function AgentPreview() {
  const defaultPrompt = `## Task
Explain the task that the Agent will be performing and what tools will be needed.
Example: Lead Generation

### Description
Describe how the Agent should complete its task.
Example: Engage with website visitors by answering their inquiries about our company and services using the provided documents.
Use the 'Airtable' tool to store this information in our company CRM.

#### Examples
Provide example prompts along with the response that you want to see for each prompt.
Example:
Q: What services do you offer?
A: We specialize in AI Agent development, primarily through our platform Agentive. If you're interested in building AI agents for your business please provide some information on the project you have in mind.
Alternatively, if you'd like to speak to our team for a consultation you can provide your name and email and we'll be in touch to book in a call.`;

  const defaultWorkspacePrompt = `## Workspace Prompt
Define workspace-specific instructions and guidelines for the agent.

### Workspace Context
Describe the workspace environment and specific requirements.
Example: This workspace is for customer support operations.

### Workspace Rules
Add any workspace-specific rules or constraints.
Example: Always maintain a professional tone and escalate complex issues to human agents.

#### Workspace Examples
Provide workspace-specific example interactions.
Example:
Q: How do I reset my password?
A: I can help you with that. Please click on the "Forgot Password" link on the login page and follow the instructions sent to your email.`;

  const [activeTab, setActiveTab] = useState("System Prompt");
  const [systemPromptContent, setSystemPromptContent] = useState("");

  const [workspacePromptContent, setWorkspacePromptContent] = useState("");

  const { data: promptsData, isLoading: isPromptsLoading } = usePromptsQuery();

  const updatePromptsMutation = useUpdatePromptsMutation();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (promptsData?.data?.systemPrompt) {
      setSystemPromptContent(promptsData?.data.systemPrompt);
    } else if (!isPromptsLoading && !promptsData?.data?.systemPrompt) {
      setSystemPromptContent(defaultPrompt);
    }

    if (promptsData?.data?.workspacePrompt) {
      setWorkspacePromptContent(promptsData?.data.workspacePrompt);
    } else if (!isPromptsLoading && !promptsData?.data?.workspacePrompt) {
      setWorkspacePromptContent(defaultWorkspacePrompt);
    }
  }, [
    promptsData,
    isPromptsLoading,
    isMounted,
    defaultPrompt,
    defaultWorkspacePrompt,
  ]);

  const handleSave = () => {
    if (activeTab === "System Prompt") {
      updatePromptsMutation.mutate({
        systemPrompt: systemPromptContent,
      });
    } else if (activeTab === "Workspace Prompt") {
      updatePromptsMutation.mutate({
        workspacePrompt: workspacePromptContent,
      });
    }
  };

  return (
    <div className="flex flex-col bg-background h-full overflow-hidden ">
      <div className="border-b border-border p-6 shrink-0">
        <h1 className="text-2xl font-semibold text-foreground">
          Prompt Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Test your AI before release
        </p>
      </div>

      <div className="flex-1 p-6 overflow-hidden max-w-6xl ">
        <div className="h-full  overflow-hidden">
          {/* Agent Configuration Section */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit shrink-0">
              {["System Prompt", "Workspace Prompt"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-3 text-sm font-medium rounded-md transition-colors ",
                    activeTab === tab
                      ? "bg-background text-foreground border border-border shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === "System Prompt" && (
              <PromptEditor
                value={systemPromptContent}
                onChange={setSystemPromptContent}
                placeholder={defaultPrompt}
                isLoading={isPromptsLoading}
                isPending={updatePromptsMutation.isPending}
                onReset={() =>
                  setSystemPromptContent(
                    promptsData?.data?.systemPrompt ?? defaultPrompt
                  )
                }
                onSave={handleSave}
                isSaveDisabled={!systemPromptContent.trim()}
              />
            )}

            {activeTab === "Workspace Prompt" && (
              <PromptEditor
                value={workspacePromptContent}
                onChange={setWorkspacePromptContent}
                placeholder={defaultWorkspacePrompt}
                isLoading={isPromptsLoading}
                isPending={updatePromptsMutation.isPending}
                onReset={() =>
                  setWorkspacePromptContent(
                    promptsData?.data?.workspacePrompt ?? defaultWorkspacePrompt
                  )
                }
                onSave={handleSave}
                isSaveDisabled={!workspacePromptContent.trim()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
