import { CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface StateTimestamp {
    state: string;
    timestamp: string;
    changedBy: string;
}

interface AuditTimelineProps {
    timestamps: StateTimestamp[];
    currentState: string;
}

const ALL_STATES = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SIGNED', 'ISSUED'];

export const AuditTimeline = ({ timestamps, currentState }: AuditTimelineProps) => {
    return (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {ALL_STATES.map((state, index) => {
                const matchingLog = timestamps.find(t => t.state === state);
                const isActiveOrPast = matchingLog || ALL_STATES.indexOf(currentState) >= index;
                const isCurrent = currentState === state;
                const isRevoked = currentState === 'REVOKED';

                if (state === 'ISSUED' && isRevoked) return null; // Hide ISSUED if revoked

                return (
                    <div key={state} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors",
                            matchingLog ? (state === 'REVOKED' ? "bg-red-500 border-red-100 dark:border-red-900" : "bg-primary border-primary/20 dark:border-primary/20") : "bg-secondary border-border"
                        )}>
                            {matchingLog ? <CheckCircle2 className="w-5 h-5 text-primary-foreground" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                        </div>
                        <div className={cn(
                            "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-card p-4 rounded-xl shadow-lg transition-all",
                            matchingLog ? "border-primary/30 bg-primary/5" : "opacity-60 grayscale"
                        )}>
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className={cn("font-bold", matchingLog ? "text-primary" : "text-muted-foreground")}>{state.replace('_', ' ')}</div>
                                {matchingLog && <time className="font-mono text-xs text-muted-foreground">{format(new Date(matchingLog.timestamp), 'PP p')}</time>}
                            </div>
                            {matchingLog ? (
                                <div className="text-sm text-muted-foreground">Action by: <span className="font-mono text-xs break-all">{matchingLog.changedBy}</span></div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">Pending...</div>
                            )}
                        </div>
                    </div>
                );
            })}

            {currentState === 'REVOKED' && (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors bg-red-500 border-red-100 dark:border-red-900">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-card p-4 rounded-xl shadow-lg border-red-500/30 bg-red-500/5">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-red-500">REVOKED</div>
                            {timestamps.find(t => t.state === 'REVOKED') && <time className="font-mono text-xs text-muted-foreground">{format(new Date(timestamps.find(t => t.state === 'REVOKED')!.timestamp), 'PP p')}</time>}
                        </div>
                        <div className="text-sm text-muted-foreground">Certificate has been permanently revoked.</div>
                    </div>
                </div>
            )}
        </div>
    );
};
