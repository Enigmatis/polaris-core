import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PermissionsCacheHolder, PermissionsServiceWrapper } from '@enigmatis/polaris-permissions';
import { SchemaDirectiveVisitor } from 'apollo-server-express';
import { defaultFieldResolver, GraphQLField } from 'graphql';

export class PermissionsDirective extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { resolve = defaultFieldResolver } = field;
        const { entityTypes, actions } = this.args;
        field.resolve = async function(source, args, context, info) {
            await validatePermissions(context, entityTypes, actions);
            return resolve.apply(this, [source, args, context, info]);
        };
    }
}

export async function validatePermissions(
    context: PolarisGraphQLContext,
    entityTypes: string[],
    actions: string[],
): Promise<void> {
    if (context.requestHeaders.upn) {
        if (!context.permissionsContext) {
            context.permissionsContext = {
                digitalFilters: {},
                permissionsCacheHolder: new PermissionsCacheHolder(),
                portalData: undefined,
            };
        }

        // Todo this is not the final place for init
        const wrapper = new PermissionsServiceWrapper(
            'test',
            {} as any,
            context.permissionsContext.permissionsCacheHolder,
        );
        const result = await wrapper.getPermissionResult(
            context.requestHeaders.upn,
            'Real0',
            entityTypes,
            actions,
        );

        context.permissionsContext.digitalFilters = result.digitalFilters || {};
        context.permissionsContext.portalData = result.portalData || {};
        if (!result.isPermitted) {
            throw new Error('Forbidden');
        }
    } else if (context.requestHeaders.requestingSystemId) {
        // implement class
    }
}
