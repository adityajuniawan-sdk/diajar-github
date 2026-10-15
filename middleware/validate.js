const validateSlug = (req, res, next) => {
    const { slug } = req.params;

    if (!slug) {
        return res.status(400).json({
            message: 'Slug wajib diisi'
        });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
            message: 'Format slug tidak valid'
        });
    }

    next();
};

module.exports = validateSlug;