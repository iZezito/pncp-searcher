/**
 * In-memory set of job IDs that have been requested for cancellation.
 * The worker checks this set on each iteration and aborts if found.
 */
export const cancelledJobs = new Set<string>();

/**
 * In-memory set of job IDs that have been paused.
 * The worker checks this set on each iteration and waits while found.
 */
export const pausedJobs = new Set<string>();
