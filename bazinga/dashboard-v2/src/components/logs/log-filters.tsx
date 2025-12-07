"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, AGENT_COLORS_TW } from "@/lib/utils";
import {
  Search,
  Filter,
  FileText,
  Clock,
  User,
  Code,
  TestTube,
  GitPullRequest,
  Bot,
  X,
} from "lucide-react";

interface LogEntry {
  id: number;
  agentType: string;
  content: string;
  timestamp: string | null;
  iteration: number | null;
  agentId: string | null;
}

interface LogFiltersProps {
  logs: LogEntry[];
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  pm: User,
  developer: Code,
  qa_expert: TestTube,
  tech_lead: GitPullRequest,
  orchestrator: Bot,
  investigator: Bot,
};

const AGENT_LABELS: Record<string, string> = {
  pm: "Project Manager",
  developer: "Developer",
  qa_expert: "QA Expert",
  tech_lead: "Tech Lead",
  orchestrator: "Orchestrator",
  investigator: "Investigator",
};

export function LogFilters({ logs }: LogFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Get unique agent types from logs
  const agentTypes = useMemo(() => {
    const types = new Set(logs.map((log) => log.agentType));
    return Array.from(types).sort();
  }, [logs]);

  // Filter logs based on search query and selected agents
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Filter by agent type
        if (selectedAgents.length > 0 && !selectedAgents.includes(log.agentType)) {
          return false;
        }
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            log.content.toLowerCase().includes(query) ||
            log.agentType.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime; // Most recent first
      });
  }, [logs, searchQuery, selectedAgents]);

  const toggleAgent = (agentType: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentType)
        ? prev.filter((a) => a !== agentType)
        : [...prev, agentType]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedAgents([]);
  };

  const hasActiveFilters = searchQuery || selectedAgents.length > 0;

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No logs available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Agent Type Filters */}
          <div className="flex flex-wrap gap-2">
            {agentTypes.map((agentType) => {
              const Icon = AGENT_ICONS[agentType] || Bot;
              const isSelected = selectedAgents.includes(agentType);
              const count = logs.filter((l) => l.agentType === agentType).length;

              return (
                <Button
                  key={agentType}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAgent(agentType)}
                  className="gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="capitalize">
                    {AGENT_LABELS[agentType] || agentType.replace("_", " ")}
                  </span>
                  <Badge
                    variant={isSelected ? "secondary" : "outline"}
                    className="ml-1 h-5 px-1.5"
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
        {hasActiveFilters && (
          <span className="text-primary">Filters applied</span>
        )}
      </div>

      {/* Log List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const Icon = AGENT_ICONS[log.agentType] || Bot;
                const isExpanded = expandedLogId === log.id;

                return (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    {/* Log Header */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          AGENT_COLORS_TW[log.agentType] || "bg-gray-500"
                        )}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">
                            {AGENT_LABELS[log.agentType] || log.agentType.replace("_", " ")}
                          </span>
                          {log.iteration != null && (
                            <Badge variant="secondary" className="text-xs">
                              Iter #{log.iteration}
                            </Badge>
                          )}
                          {log.timestamp && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                              <Clock className="h-3 w-3" />
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm text-muted-foreground",
                            !isExpanded && "line-clamp-2"
                          )}
                        >
                          {log.content}
                        </p>
                        {!isExpanded && log.content.length > 150 && (
                          <button className="text-xs text-primary mt-1 hover:underline">
                            Click to expand
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredLogs.length === 0 && (
              <div className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No logs match your filters
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
