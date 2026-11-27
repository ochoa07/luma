import { getDashboardCounts } from '../models/admin.js';

export async function showAdminDashboard(req, res) {
    const counts = await getDashboardCounts();

    return res.render('admin', { counts });
}