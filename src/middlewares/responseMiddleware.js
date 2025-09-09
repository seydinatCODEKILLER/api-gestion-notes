export class ResponseHandler {
  constructor(config = {}) {
    this.config = {
      defaultSuccessMessage:
        config.defaultSuccessMessage || "Opération réussie",
      defaultErrorMessage:
        config.defaultErrorMessage || "Une erreur est survenue",
      defaultSuccessStatus: config.defaultSuccessStatus || 200,
      defaultErrorStatus: config.defaultErrorStatus || 400,
    };
  }

  async handle(c, next) {
    c.success = (
      data,
      message = this.config.defaultSuccessMessage,
      status = this.config.defaultSuccessStatus
    ) => {
      return c.json({ success: true, message, data }, status);
    };

    c.error = (
      message = this.config.defaultErrorMessage,
      status = this.config.defaultErrorStatus,
      data = null
    ) => {
      return c.json({ success: false, message, data }, status);
    };

    try {
      return await next();
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || "Erreur interne du serveur";
      return c.error(message, status);
    }
  }
}

const responseHandlerInstance = new ResponseHandler();
export default responseHandlerInstance.handle.bind(responseHandlerInstance);
