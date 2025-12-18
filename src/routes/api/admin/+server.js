import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
    return json({authenticate:true});
}
