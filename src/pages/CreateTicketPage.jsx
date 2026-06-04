import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";

import api from "../api/api";
import Navbar from "../components/Navbar";


const statusLabels = {
    new: "Новая",
    in_progress: "В работе",
    completed: "Завершена",
    closed: "Закрыта",
    archived: "Архивирована"
};


function formatAddress(address) {

    return `${address.street}, д. ${address.house}, п. ${address.entrance || "-"}, кв. ${address.apartment}`;
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("ru-RU");
}


function CreateTicketPage() {

    const navigate = useNavigate();

    const [description, setDescription] =
        useState("");

    const [addresses, setAddresses] =
        useState([]);

    const [addressId, setAddressId] =
        useState("");

    const [categories, setCategories] =
        useState([]);

    const [categoryId, setCategoryId] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [similarMatches, setSimilarMatches] =
        useState([]);

    const [similarDialogOpen, setSimilarDialogOpen] =
        useState(false);

    useEffect(() => {
        loadAddresses();
        loadCategories();
    }, []);

    const getAuthHeaders = () => {

        const token =
            localStorage.getItem("token");

        return {
            Authorization: `Bearer ${token}`
        };
    };

    const loadAddresses = async () => {

        try {

            const response =
                await api.get(
                    "/addresses/my/verified",
                    {
                        headers: getAuthHeaders()
                    }
                );

            setAddresses(response.data);

            if (response.data.length === 1) {
                setAddressId(response.data[0].address_id);
            }

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить подтвержденные адреса.");
        }
    };

    const loadCategories = async () => {

        try {

            const response = await api.get(
                "/categories/",
                {
                    headers: getAuthHeaders()
                }
            );

            setCategories(response.data);

            if (response.data.length > 0) {
                setCategoryId(String(response.data[0].id));
            }

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить категории заявок.");
        }
    };

    const getApiError = (err) => {

        const detail = err.response?.data?.detail;

        if (detail === "Address is not verified or not linked to current user") {
            return "Нельзя создать заявку по неподтвержденному или чужому адресу.";
        }

        if (detail === "Invalid category") {
            return "Выберите категорию проблемы.";
        }

        if (typeof detail === "string") {
            return detail;
        }

        if (detail?.message) {
            return detail.message;
        }

        return "Не удалось выполнить операцию.";
    };

    const buildPayload = (forceCreate = false) => ({
        description,
        category_id: Number(categoryId),
        address_id: Number(addressId),
        force_create: forceCreate
    });

    const checkSimilar = async () => {

        const response = await api.post(
            "/tickets/check-similar",
            {
                description,
                category_id: Number(categoryId),
                address_id: Number(addressId)
            },
            {
                headers: getAuthHeaders()
            }
        );

        return response.data;
    };

    const createTicket = async (forceCreate = false) => {

        const response = await api.post(
            "/tickets/",
            buildPayload(forceCreate),
            {
                headers: getAuthHeaders()
            }
        );

        return response.data;
    };

    const joinTicket = async (ticketId) => {

        await api.post(
            `/tickets/${ticketId}/join`,
            {
                description
            },
            {
                headers: getAuthHeaders()
            }
        );
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        setMessage("");
        setError("");

        if (!addressId) {
            setError("Выберите подтвержденный адрес.");
            return;
        }

        if (!categoryId) {
            setError("Выберите категорию проблемы.");
            return;
        }

        setLoading(true);

        try {

            const similarResult = await checkSimilar();

            if (similarResult.similar_found) {
                setSimilarMatches(similarResult.matches);
                setSimilarDialogOpen(true);
                return;
            }

            await createTicket(false);
            setMessage("Заявка создана. Её можно отслеживать в списке.");
            setDescription("");

        } catch (err) {
            console.error(err);

            if (err.response?.status === 409) {
                const matches = err.response?.data?.detail?.matches || [];
                setSimilarMatches(matches);
                setSimilarDialogOpen(true);
                return;
            }

            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (ticketId) => {

        setLoading(true);
        setError("");
        setMessage("");

        try {

            await joinTicket(ticketId);
            setSimilarDialogOpen(false);
            setMessage("Вы присоединились к существующей заявке.");
            setDescription("");
            navigate("/dashboard");

        } catch (err) {
            console.error(err);
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleForceCreate = async () => {

        setLoading(true);
        setError("");
        setMessage("");

        try {

            await createTicket(true);
            setSimilarDialogOpen(false);
            setMessage("Отдельная заявка создана.");
            setDescription("");

        } catch (err) {
            console.error(err);
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const hasNoVerifiedAddresses =
        addresses.length === 0;

    return (

        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container
                maxWidth="md"
                sx={{ py: 4 }}
            >
                <Card>
                    <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h4" gutterBottom>
                                    Создание заявки
                                </Typography>
                                <Typography color="text.secondary">
                                    Выберите категорию — похожие заявки ищутся только внутри неё (тот же дом).
                                </Typography>
                            </Box>

                            {hasNoVerifiedAddresses && (
                                <Alert severity="warning">
                                    У вас нет подтвержденных адресов. Добавьте адрес в профиле и дождитесь подтверждения.
                                </Alert>
                            )}

                            {message && (
                                <Alert severity="success">
                                    {message}
                                </Alert>
                            )}

                            {error && (
                                <Alert severity="error">
                                    {error}
                                </Alert>
                            )}

                            <Stack
                                component="form"
                                spacing={2}
                                onSubmit={handleSubmit}
                            >
                                {addresses.length === 1 && (
                                    <TextField
                                        label="Адрес"
                                        value={formatAddress(addresses[0])}
                                        disabled
                                        fullWidth
                                    />
                                )}

                                {addresses.length > 1 && (
                                    <FormControl fullWidth>
                                        <InputLabel>
                                            Адрес
                                        </InputLabel>
                                        <Select
                                            label="Адрес"
                                            value={addressId}
                                            required
                                            onChange={(event) =>
                                                setAddressId(event.target.value)
                                            }
                                        >
                                            {addresses.map((address) => (
                                                <MenuItem
                                                    key={address.id}
                                                    value={address.address_id}
                                                >
                                                    {formatAddress(address)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                <FormControl fullWidth required>
                                    <InputLabel>
                                        Категория проблемы
                                    </InputLabel>
                                    <Select
                                        label="Категория проблемы"
                                        value={categoryId}
                                        disabled={hasNoVerifiedAddresses || categories.length === 0}
                                        onChange={(event) =>
                                            setCategoryId(event.target.value)
                                        }
                                    >
                                        {categories.map((category) => (
                                            <MenuItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={6}
                                    label="Описание проблемы"
                                    placeholder="Например: в подъезде не работает освещение..."
                                    value={description}
                                    required
                                    disabled={hasNoVerifiedAddresses}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading || hasNoVerifiedAddresses || !categoryId}
                                >
                                    {loading ? "Проверяем..." : "Отправить обращение"}
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>

            <Dialog
                open={similarDialogOpen}
                onClose={() => setSimilarDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Найдены похожие активные заявки
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography color="text.secondary">
                            Чтобы не создавать дубликат, вы можете присоединиться к существующей заявке
                            или продолжить создание отдельного обращения.
                        </Typography>

                        {similarMatches.map((match) => (
                            <Card key={match.id} variant="outlined">
                                <CardContent>
                                    <Stack spacing={1}>
                                        <Typography variant="h6">
                                            Заявка #{match.id}
                                        </Typography>
                                        {match.category_name && (
                                            <Typography variant="body2" color="text.secondary">
                                                Категория: {match.category_name}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            Статус: {statusLabels[match.status] || match.status}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Создана: {formatDate(match.created_at)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Подписчиков: {match.subscribers_count}
                                        </Typography>
                                        <Typography>
                                            {match.description}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Схожесть: {Math.round(match.similarity_score * 100)}%
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            disabled={loading}
                                            onClick={() => handleJoin(match.id)}
                                        >
                                            Присоединиться к этой заявке
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setSimilarDialogOpen(false)}
                        disabled={loading}
                    >
                        Отмена
                    </Button>
                    <Button
                        variant="outlined"
                        color="warning"
                        disabled={loading}
                        onClick={handleForceCreate}
                    >
                        Создать отдельную заявку
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CreateTicketPage;
