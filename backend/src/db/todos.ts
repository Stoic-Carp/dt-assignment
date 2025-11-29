import { PutCommand, ScanCommand, GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from 'crypto';
import { docClient, TABLE_NAME } from "./dynamodb";
import { Todo, CreateTodoRequest, UpdateTodoRequest } from "../types";

export const getAllTodos = async (): Promise<Todo[]> => {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
    });

    const response = await docClient.send(command);
    return (response.Items as Todo[]) || [];
};

export const getTodoById = async (id: string): Promise<Todo | null> => {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
    });

    const response = await docClient.send(command);
    return (response.Item as Todo) || null;
};

export const createTodo = async (todo: CreateTodoRequest): Promise<Todo> => {
    const timestamp = new Date().toISOString();
    const newTodo: Todo = {
        id: randomUUID(),
        title: todo.title,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    if (todo.description) {
        newTodo.description = todo.description;
    }

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: newTodo,
    });

    await docClient.send(command);
    return newTodo;
};

export const updateTodo = async (id: string, updates: UpdateTodoRequest): Promise<Todo | null> => {
    const timestamp = new Date().toISOString();

    // Build update expression
    let updateExpression = "set updatedAt = :updatedAt";
    const expressionAttributeValues: Record<string, string | boolean> = {
        ":updatedAt": timestamp,
    };
    const expressionAttributeNames: Record<string, string> = {};

    if (updates.title !== undefined) {
        updateExpression += ", #title = :title";
        expressionAttributeValues[":title"] = updates.title;
        expressionAttributeNames["#title"] = "title";
    }

    if (updates.description !== undefined) {
        updateExpression += ", description = :description";
        expressionAttributeValues[":description"] = updates.description;
    }

    if (updates.completed !== undefined) {
        updateExpression += ", completed = :completed";
        expressionAttributeValues[":completed"] = updates.completed;
    }

    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ReturnValues: "ALL_NEW",
    });

    try {
        const response = await docClient.send(command);
        return response.Attributes as Todo;
    } catch (error) {
        return null;
    }
};

export const deleteTodo = async (id: string): Promise<boolean> => {
    const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
    });

    await docClient.send(command);
    return true;
};
