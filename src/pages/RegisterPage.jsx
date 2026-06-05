import {
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Container,
    FormControlLabel,
    Stack,
    TextField,
    Typography
} from "@mui/material";

import api from "../api/api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


function normalizeRegistrationData(formData) {

    return {
        ...formData,
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        house: formData.house.trim(),
        entrance: formData.entrance.trim(),
        apartment: formData.apartment.trim(),
        personal_account: formData.personal_account.trim()
    };
}


function validatePassword(password) {

    if (password.length < 8) {
        return "Пароль должен содержать минимум 8 символов.";
    }

    if (![...password].some((char) => (
        /[A-Za-z]/.test(char) ||
        char.toLowerCase() !== char.toUpperCase()
    ))) {
        return "Пароль должен содержать хотя бы одну букву.";
    }

    if (!/\d/.test(password)) {
        return "Пароль должен содержать хотя бы одну цифру.";
    }

    if (password.trim() !== password) {
        return "Пароль не должен начинаться или заканчиваться пробелом.";
    }

    return "";
}


function validateRegistrationData(data) {

    if (data.full_name.length < 2) {
        return "Укажите ФИО.";
    }

    if (!emailPattern.test(data.email)) {
        return "Введите корректный email.";
    }

    if (data.phone.length < 5) {
        return "Укажите корректный телефон.";
    }

    const passwordError = validatePassword(data.password);

    if (passwordError) {
        return passwordError;
    }

    if (
        data.street.length < 2 ||
        !data.house ||
        !data.entrance ||
        !data.apartment ||
        data.personal_account.length < 3
    ) {
        return "Проверьте корректность адреса и лицевого счета.";
    }

    return "";
}


function RegisterPage() {

    const navigate = useNavigate();

    const [formData, setFormData] =
        useState({
            full_name: "",
            email: "",
            phone: "",
            password: "",
            street: "",
            house: "",
            entrance: "",
            apartment: "",
            personal_account: ""
        });

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [personalDataConsent, setPersonalDataConsent] =
        useState(false);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getApiError = (err) => {

        const detail = err.response?.data?.detail;

        if (Array.isArray(detail)) {
            return "Проверьте корректность заполненных полей.";
        }

        if (detail === "Email already exists") {
            return "Пользователь с таким email уже существует.";
        }

        if (detail === "Personal data processing consent is required") {
            return "Необходимо дать согласие на обработку персональных данных.";
        }

        return "Не удалось зарегистрироваться. Проверьте данные.";
    };

    const handleRegister = async (e) => {

        e.preventDefault();
        setError("");

        const normalizedData = normalizeRegistrationData(formData);
        const validationError = validateRegistrationData(normalizedData);

        if (validationError) {
            setError(validationError);
            return;
        }


        if (!personalDataConsent) {
            setError("Необходимо дать согласие на обработку персональных данных.");
            return;
        }

        setLoading(true);

        try {

            await api.post(
                "/auth/register",
                {
                    ...formData,
                    ...normalizedData,
                    role: "resident",
                    personal_data_consent: true
                }
            );

            navigate("/");

        } catch (err) {
            console.error(err);
            setError(getApiError(err));
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
            <Container maxWidth="md">
                <Card>
                    <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h4" gutterBottom>
                                    Регистрация жильца
                                </Typography>
                                <Typography color="text.secondary">
                                    Укажите контакты и адрес. После регистрации адрес будет ожидать подтверждения.
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
                                onSubmit={handleRegister}
                            >
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "1fr 1fr"
                                        },
                                        gap: 2
                                    }}
                                >
                                    <TextField
                                        label="ФИО"
                                        name="full_name"
                                        value={formData.full_name}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Телефон"
                                        name="phone"
                                        value={formData.phone}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Пароль"
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        required
                                        fullWidth
                                        helperText="Минимум 8 символов, буква и цифра"
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Улица"
                                        name="street"
                                        value={formData.street}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Лицевой счет"
                                        name="personal_account"
                                        value={formData.personal_account}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Дом"
                                        name="house"
                                        value={formData.house}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Подъезд"
                                        name="entrance"
                                        value={formData.entrance}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />

                                    <TextField
                                        label="Квартира"
                                        name="apartment"
                                        value={formData.apartment}
                                        required
                                        fullWidth
                                        onChange={handleChange}
                                    />
                                </Box>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={personalDataConsent}
                                            onChange={(event) =>
                                                setPersonalDataConsent(
                                                    event.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="Я даю согласие на обработку персональных данных в соответствии с Федеральным законом № 152-ФЗ"
                                />

                                <Button
                                    fullWidth
                                    variant="contained"
                                    type="submit"
                                    size="large"
                                    disabled={loading || !personalDataConsent}
                                >
                                    {loading ? "Создаем аккаунт..." : "Зарегистрироваться"}
                                </Button>
                            </Stack>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                textAlign="center"
                            >
                                Уже есть аккаунт?{" "}
                                <Typography
                                    component={Link}
                                    to="/"
                                    color="primary"
                                    fontWeight={700}
                                >
                                    Войти
                                </Typography>
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

export default RegisterPage;
