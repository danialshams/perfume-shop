import { NextResponse } from "next/server";

export function successResponse<T>(data: T, message = "Success", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

export function errorResponse(
  error: unknown = "Something went wrong",
  status = 500,
  errors?: unknown,
) {
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
        errors: errors ?? null,
      },
      { status },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: typeof error === "string" ? error : "Something went wrong",
      errors: errors ?? null,
    },
    { status },
  );
}

export function ok(data: unknown, message = "success") {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: 200 },
  );
}

export function created(data: unknown, message = "created") {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: 201 },
  );
}

export function badRequest(message = "Bad Request", errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors: errors ?? null,
    },
    { status: 400 },
  );
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 401 },
  );
}

export function notFound(message = "Not Found") {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 404 },
  );
}

export function validationErrorResponse(errors: unknown) {
  return NextResponse.json(
    {
      success: false,
      message: "Validation error",
      errors,
    },
    { status: 422 },
  );
}

export function createdResponse<T>(data: T, message = "Created") {
  return successResponse(data, message, 201);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return unauthorized(message);
}

export function badRequestResponse(message = "Bad Request", errors?: unknown) {
  return badRequest(message, errors);
}

export function notFoundResponse(message = "Not Found") {
  return notFound(message);
}
