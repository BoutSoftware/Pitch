export interface ApiResponse<DataType = unknown> {
    code: ApiResponseCode;
    message: string;
    data?: DataType;
}

export type ApiResponseCode =
    "OK" | // Request was successful
    "MISSING_FIELDS" | // Required fields are missing
    "BAD_REQUEST" | // Request is malformed
    "INVALID_CREDENTIALS" | // Provided credentials are invalid
    "INVALID_TOKEN" | // Provided token is invalid
    "INVALID_PERMISSIONS" | // Insufficient permissions for the request
    "INTERNAL_ERROR" | // An internal server error occurred
    "UNAUTHORIZED" | // User is not authorized to access the resource
    "UNAUTHENTICATED" | // User is not authenticated
    "ALREADY_EXISTS" | // Resource already exists
    "EXPIRED" | // Resource has expired
    "NOT_FOUND"; // Resource was not found