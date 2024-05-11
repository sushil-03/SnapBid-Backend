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
const mongoose_1 = __importDefault(require("mongoose"));
const connectionString = `mongodb+srv://sushil:${process.env.DB_PASS}@cluster0.hzhsnsh.mongodb.net/?retryWrites=true&w=majority`;
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default
        .connect(connectionString)
        .then((data) => {
        console.log(`Mongodb is connected with server ${data.connection.host}`);
    })
        .catch((error) => {
        console.log("Mongodb error", error);
    });
});
exports.default = connectDB;
// module.exports = connectDB;
