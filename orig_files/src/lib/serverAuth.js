import { supabase } from './supabaseClient.js';

export async function getAuthenticatedEmail(request) {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return null;
        }

        return data.user.email;
    } catch (err) {
        console.error('Auth verification error:', err);
        return null;
    }
}
