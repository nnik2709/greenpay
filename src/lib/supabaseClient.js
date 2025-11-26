/**
 * Supabase Compatibility Layer - Redirects to PostgreSQL API
 */
import api from './api/client';

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      try {
        const result = await api.auth.login(email, password);
        return {
          data: {
            user: result.user,
            session: { user: result.user, access_token: result.token }
          },
          error: null
        };
      } catch (error) {
        return {
          data: { user: null, session: null },
          error: { message: error.message }
        };
      }
    },

    signOut: async () => {
      try {
        await api.auth.logout();
        return { error: null };
      } catch (error) {
        return { error: { message: error.message } };
      }
    },

    getSession: () => {
      const session = api.auth.getSession();
      return {
        data: { session: session.session }
      };
    },

    getUser: async () => {
      try {
        const user = await api.auth.getCurrentUser();
        return { data: { user }, error: null };
      } catch (error) {
        return { data: { user: null }, error: { message: error.message } };
      }
    },

    onAuthStateChange: (callback) => {
      const session = api.auth.getSession();
      if (session.session) {
        setTimeout(() => callback('SIGNED_IN', session.session), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  },

  from: (table) => {
    console.warn(`Direct table access to '${table}' needs migration`);
    // Return a more complete mock query builder
    const mockQuery = {
      select: () => mockQuery,
      insert: () => mockQuery,
      update: () => mockQuery,
      delete: () => mockQuery,
      eq: () => mockQuery,
      neq: () => mockQuery,
      gt: () => mockQuery,
      gte: () => mockQuery,
      lt: () => mockQuery,
      lte: () => mockQuery,
      like: () => mockQuery,
      ilike: () => mockQuery,
      is: () => mockQuery,
      in: () => mockQuery,
      contains: () => mockQuery,
      order: () => mockQuery,
      limit: () => mockQuery,
      range: () => mockQuery,
      single: async () => ({ data: null, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: async (resolve) => resolve({ data: [], error: null })
    };
    return mockQuery;
  }
};

export default supabase;
