import { ContextUser } from '../module/users/database/models';

export interface AppContext {
  currentUser: ContextUser | null;
}

function createAppContext(): AppContext {
  const context: Partial<AppContext> = {
    currentUser: null,
  };

  return context as AppContext;
}

export default createAppContext;

/**
 * The partial means allows to create the context object without immediately
 * satisfying all required properties of AppContext.
 * It can return partially filled context object
 */
