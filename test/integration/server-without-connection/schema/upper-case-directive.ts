import { SchemaDirectiveVisitor } from 'apollo-server-express';
import {
    defaultFieldResolver,
    GraphQLField,
    GraphQLInterfaceType,
    GraphQLObjectType,
} from 'graphql';

export class UpperCaseDirective extends SchemaDirectiveVisitor {
    public visitFieldDefinition(
        field: GraphQLField<any, any>,
        details: { objectType: GraphQLObjectType | GraphQLInterfaceType },
    ): GraphQLField<any, any> | void | null {
        const { resolve = defaultFieldResolver } = field;
        field.resolve = async function(...args) {
            const result = await resolve.apply(this, args);
            if (typeof result === 'string') {
                return result.toUpperCase();
            }
            return result;
        };
    }
}
