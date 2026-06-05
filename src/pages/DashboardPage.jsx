import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Stack,
    Typography
} from "@mui/material";

import api from "../api/api";
import Navbar from "../components/Navbar";


const statusLabels = {
    new: "Новая",
    in_progress: "В работе",
    completed: "Выполнена",
    closed: "Закрыта",
    auto_closed: "Закрыта автоматически",
    dispute_review: "На повторной проверке",
    archived: "Архивирована"
};

const statusColors = {
    new: "error",
    in_progress: "warning",
    completed: "success",
    closed: "default",
    auto_closed: "default",
    dispute_review: "warning",
    archived: "default"
};


function DashboardPage() {

    const [tickets, setTickets] =
        useState([]);

    const [error, setError] =
        useState("");

    const fetchTickets = useCallback(async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response =
                await api.get(
                    "/tickets/",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

            setTickets(response.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить заявки.");
        }
    }, []);

    useEffect(() => {

        const timeoutId = window.setTimeout(() => {
            fetchTickets();
        }, 0);

        return () => window.clearTimeout(timeoutId);

    }, [fetchTickets]);

    const stats = [
        {
            label: "Новые",
            value: tickets.filter((ticket) =>
                ticket.status === "new"
            ).length
        },
        {
            label: "В работе",
            value: tickets.filter((ticket) =>
                ticket.status === "in_progress"
            ).length
        },
        {
            label: "Завершенные",
            value: tickets.filter((ticket) =>
                ticket.status === "completed"
            ).length
        }
    ];

    return (

        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container
                maxWidth="lg"
                sx={{ py: 4 }}
            >
                <Stack spacing={3}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                    >
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                Мои заявки
                            </Typography>
                            <Typography color="text.secondary">
                                Следите за статусами обращений и открывайте детали заявки.
                            </Typography>
                        </Box>

                        <Button
                            component={Link}
                            to="/create-ticket"
                            variant="contained"
                            size="large"
                        >
                            Создать заявку
                        </Button>
                    </Stack>

                    {error && (
                        <Alert severity="error">
                            {error}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(3, 1fr)"
                            },
                            gap: 2
                        }}
                    >
                        {stats.map((item) => (
                            <Card key={item.label}>
                                <CardContent>
                                    <Typography
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        {item.label}
                                    </Typography>
                                    <Typography variant="h4">
                                        {item.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    <Stack spacing={2}>
                        {tickets.length === 0 && !error && (
                            <Card>
                                <CardContent sx={{ py: 5, textAlign: "center" }}>
                                    <Typography variant="h6" gutterBottom>
                                        Заявок пока нет
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Создайте первое обращение, и оно появится здесь.
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        {tickets.map((ticket) => (
                            <Card key={ticket.id}>
                                <CardContent>
                                    <Stack
                                        direction={{ xs: "column", md: "row" }}
                                        spacing={2}
                                        justifyContent="space-between"
                                    >
                                        <Stack spacing={1.5}>
                                            <Typography variant="h6">
                                                Заявка #{ticket.id}
                                            </Typography>

                                            <Typography color="text.secondary">
                                                {ticket.description}
                                            </Typography>

                                            {ticket.category?.name && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Категория: {ticket.category.name}
                                                </Typography>
                                            )}

                                            <Typography variant="body2">
                                                Адрес:{" "}
                                                {ticket.address
                                                    ? `${ticket.address.street}, д. ${ticket.address.house}, п. ${ticket.address.entrance || "-"}, кв. ${ticket.address.apartment}`
                                                    : "не указан"}
                                            </Typography>

                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{ flexWrap: "wrap", rowGap: 1 }}
                                            >
                                                <Chip
                                                    label={statusLabels[ticket.status] || ticket.status}
                                                    color={statusColors[ticket.status] || "default"}
                                                />
                                                <Chip
                                                    label={`Приоритет: ${ticket.priority}`}
                                                    variant="outlined"
                                                />
                                                {ticket.subscribers_count > 0 && (
                                                    <Chip
                                                        label={`Подписчиков: ${ticket.subscribers_count}`}
                                                        color="info"
                                                        variant="outlined"
                                                    />
                                                )}
                                                {ticket.is_linked && !ticket.is_creator && (
                                                    <Chip
                                                        label="Присоединённая"
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Stack>
                                        </Stack>

                                        <Box>
                                            <Button
                                                component={Link}
                                                to={`/tickets/${ticket.id}`}
                                                variant="outlined"
                                            >
                                                Открыть
                                            </Button>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}

export default DashboardPage;
