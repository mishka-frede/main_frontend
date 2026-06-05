import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Stack,
    TextField,
    Typography
} from "@mui/material";

import api from "../api/api";

import {
    getHomePath,
    setToken
} from "../auth/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


function validateLoginData(email, password) {

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
        return "Введите корректный email.";
    }

    if (!password.trim()) {
        return "Введите пароль.";
    }

    if (password.length < 8) {
        return "Пароль должен содержать минимум 8 символов.";
    }

    return "";
}


function LoginPage() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();
        setError("");

        const validationError = validateLoginData(email, password);

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {

            const formData = new FormData();

            formData.append("username", email.trim().toLowerCase());
            formData.append("password", password);

            const response = await api.post(
                "/auth/login",
                formData
            );

            setToken(response.data.access_token);

            const role = response.data.role || "resident";

            navigate(
                getHomePath(role),
                { replace: true }
            );

        } catch (err) {
            console.error(err);
            setError("Не удалось войти. Проверьте email и пароль.");
        } finally {
            setLoading(false);
        }
    };

    return (

        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                py: 6
            }}
        >
            <Container maxWidth="sm">
                <Card>
                    <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h4" gutterBottom>
                                    Вход в систему
                                </Typography>
                                <Typography color="text.secondary">
                                    Авторизуйтесь, чтобы создавать и отслеживать заявки ТСЖ.
                                </Typography>
                            </Box>

                            {error && (
                                <Alert severity="error">
                                    {error}
                                </Alert>
                            )}

                            <Stack
                                component="form"
                                spacing={2}
                                onSubmit={handleLogin}
                            >
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={email}
                                    required
                                    fullWidth
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                />

                                <TextField
                                    label="Пароль"
                                    type="password"
                                    value={password}
                                    required
                                    fullWidth
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    fullWidth
                                >
                                    {loading ? "Входим..." : "Войти"}
                                </Button>
                            </Stack>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                textAlign="center"
                            >
                                Нет аккаунта?{" "}
                                <Typography
                                    component={Link}
                                    to="/register"
                                    color="primary"
                                    fontWeight={700}
                                >
                                    Зарегистрироваться
                                </Typography>
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

export default LoginPage;
