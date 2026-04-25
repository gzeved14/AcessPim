export const validateBody = (schema) => {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            return next();
        }
        catch (error) {
            return next(error);
        }
    };
};
//# sourceMappingURL=validateBody.js.map