"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
exports.app = (0, express_1.default)();
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("dotenv").config({
    path: __dirname + "/config/config.env"
});
const body_parser_1 = __importDefault(require("body-parser"));
const datatbase_1 = __importDefault(require("./config/datatbase"));
const cloudinary_1 = require("cloudinary");
const productController_1 = require("./controller/productController");
// Routes
const userRouter_1 = __importDefault(require("./router/userRouter"));
const productRouter_1 = __importDefault(require("./router/productRouter"));
const orderRouter_1 = __importDefault(require("./router/orderRouter"));
const serviceRouter_1 = __importDefault(require("./router/serviceRouter"));
exports.app.use((0, cors_1.default)());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json({
    limit: "1000mb",
}));
(function () {
    (0, productController_1.restartCronJob)();
})();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
(0, datatbase_1.default)();
exports.app.use(body_parser_1.default.urlencoded({ limit: "1000mb", extended: true }));
exports.app.post("/webhook", express_1.default.json({ type: "application/json" }), (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const event = request.body;
    switch (event.type) {
        case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            yield (0, productController_1.updateProductStatusOnSuccess)(paymentIntent.metadata);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    response.json({ received: true });
}));
exports.app.use("/api/v1", userRouter_1.default);
exports.app.use("/api/v1", productRouter_1.default);
exports.app.use("/api/v1", serviceRouter_1.default);
exports.app.use("/api/v1", orderRouter_1.default);
exports.app.use("/", (_req, res) => {
    res.json({
        message: "Server is up ",
    });
});
exports.app.listen(8000, () => {
    console.log(`Server is running on PORT http://localhost:8000`);
});
// export default app
