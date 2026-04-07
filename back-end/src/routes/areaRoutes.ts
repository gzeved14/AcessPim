import { Router } from 'express';

const areaRoutes = Router();

areaRoutes.get('/', (_req, res) => {
	res.status(200).json({ message: 'Rota de area ativa' });
});

export default areaRoutes;
