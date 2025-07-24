"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, User, Bot, AlertCircle } from "lucide-react";

interface ProjectViewProps {
  projectId: string;
}

const ProjectView = ({ projectId }: ProjectViewProps) => {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({ projectId })
  );

  const { data: messages } = useSuspenseQuery(
    trpc.message.getMany.queryOptions({ projectId })
  );

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageIcon = (role: string, type: string) => {
    if (role === "USER") {
      return <User className="w-4 h-4 text-blue-500" />;
    }
    if (type === "ERROR") {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <Bot className="w-4 h-4 text-green-500" />;
  };

  const getMessageBorderColor = (role: string, type: string) => {
    if (role === "USER") return "border-l-blue-500";
    if (type === "ERROR") return "border-l-red-500";
    return "border-l-green-500";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Project Header */}
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            Created {formatDate(project.createdAt)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Project ID:{" "}
          <code className="bg-muted px-2 py-1 rounded text-xs">
            {project.id}
          </code>
        </div>
      </div>

      {/* Messages Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Messages</h2>
          <div className="text-sm text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center">
            <div className="text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">
                Start a conversation to see messages here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-card rounded-lg border-l-4 ${getMessageBorderColor(
                  message.role,
                  message.type
                )} p-4 shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getMessageIcon(message.role, message.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {message.role === "USER" ? "You" : "Assistant"}
                        </span>
                        {message.type === "ERROR" && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Error
                          </span>
                        )}
                        {message.type === "RESULT" &&
                          message.role === "ASSISTANT" && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Result
                            </span>
                          )}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </time>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/50 p-3 rounded border overflow-x-auto">
                        {message.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
