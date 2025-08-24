// Core Result types
export type Success<T> = { success: true; data: T };
export type Failure<E = string> = { success: false; message: E };

// Main Result type (synchronous)
export type Result<D, E = string> = Success<D> | Failure<E>;

// Async Result type
export type AsyncResult<D, E = string> = Promise<Result<D, E>>;
