function createSyntheticError(name, message) {
    return {
        name: name,
        message: message,
        traceback: null
    };
}

exports.createSyntheticError = createSyntheticError;