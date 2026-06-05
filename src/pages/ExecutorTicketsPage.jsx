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
    completed: "Выполнена",
    closed: "Закрыта",
    auto_closed: "Закрыта автоматически",
    dispute_review: "На повторной проверке",
    archived: "Архивирована"
};


function formatAddress(address) {

    if (!address) {
        return "Не указан";
    }

    return `${address.street}, д. ${address.house}, п. ${address.entrance || "-"}, кв. ${address.apartment}`;
}


function ExecutorTicketsPage() {

    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [reportDrafts, setReportDrafts] = useState({});
    const [updatingTicketId, setUpdatingTicketId] = useState(null);

    const getAuthHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }), []);

    const fetchTickets = useCallback(async () => {

        try {

            const response = await api.get(
                "/tickets/assigned-to-me",
                {
                    headers: getAuthHeaders(),
                    params: {
                        search: search.trim() || undefined,
                        status: status || undefined
                    }
                }
            );

            setTickets(response.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить назначенные заявки.");
        }
    }, [getAuthHeaders, search, status]);

    const changeTicketStatus = async (ticketId, nextStatus) => {

        setError("");
        setMessage("");
        setUpdatingTicketId(ticketId);

        try {

            await api.patch(
                `/tickets/${ticketId}/executor-status`,
                { status: nextStatus },
                { headers: getAuthHeaders() }
            );

            setMessage("Статус заявки обновлен.");
            await fetchTickets();

        } catch (err) {
            console.error(err);
            setError("Не удалось обновить статус заявки.");
        } finally {
            setUpdatingTicketId(null);
        }
    };

    const submitReport = async (ticketId) => {

        const text = (reportDrafts[ticketId] || "").trim();

        if (!text) {
            setMessage("");
            setError("Укажите отчет о выполнении.");
            return;
        }

        setError("");
        setMessage("");
        setUpdatingTicketId(ticketId);

        try {

            await api.post(
                `/tickets/${ticketId}/executor-report`,
                { text },
                { headers: getAuthHeaders() }
            );

            setReportDrafts((current) => ({
                ...current,
                [ticketId]: ""
            }));
            setMessage("Отчет сохранен.");

        } catch (err) {
            console.error(err);
            setError("Не удалось сохранить отчет.");
        } finally {
            setUpdatingTicketId(null);
        }
    };

    useEffect(() => {

        const timeoutId = window.setTimeout(() => {
            fetchTickets();
        }, 300);

        return () => window.clearTimeout(timeoutId);

    }, [fetchTickets]);

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Мои назначенные заявки
                        </Typography>
                        <Typography color="text.secondary">
                            Заявки, где вы указаны исполнителем.
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}

                    {message && (
                        <Alert severity="success">{message}</Alert>
                    )}

                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={2}
                            >
                                <TextField
                                    fullWidth
                                    label="Поиск"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />
                                <FormControl sx={{ minWidth: 220 }}>
                                    <InputLabel>Статус</InputLabel>
                                    <Select
                                        label="Статус"
                                        value={status}
                                        onChange={(event) =>
                                            setStatus(event.target.value)
                                        }
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        {Object.entries(statusLabels).map(([value, label]) => (
                                            <MenuItem key={value} value={value}>
                                                {label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Stack spacing={2}>
                        {tickets.length === 0 && !error && (
                            <Card>
                                <CardContent sx={{ py: 5, textAlign: "center" }}>
                                    <Typography color="text.secondary">
                                        Назначенных заявок пока нет.
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        {tickets.map((ticket) => {
                            const isUpdating = updatingTicketId === ticket.id;
                            const reportText = reportDrafts[ticket.id] || "";

                            return (
                                <Card key={ticket.id}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack
                                                direction={{ xs: "column", md: "row" }}
                                                spacing={2}
                                                justifyContent="space-between"
                                            >
                                                <Stack spacing={1}>
                                                    <Typography variant="h6">
                                                        Заявка #{ticket.id}
                                                    </Typography>
                                                    <Typography color="text.secondary">
                                                        {ticket.description}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Адрес: {formatAddress(ticket.address)}
                                                    </Typography>
                                                    {ticket.category?.name && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Категория: {ticket.category.name}
                                                        </Typography>
                                                    )}
                                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                                                        <Chip label={statusLabels[ticket.status] || ticket.status} />
                                                        <Chip label={`Приоритет: ${ticket.priority}`} variant="outlined" />
                                                    </Stack>
                                                </Stack>

                                                <Stack
                                                    direction={{ xs: "column", sm: "row", md: "column" }}
                                                    spacing={1}
                                                    alignItems="stretch"
                                                >
                                                    <Button
                                                        component={Link}
                                                        to={`/tickets/${ticket.id}`}
                                                        variant="outlined"
                                                    >
                                                        Открыть
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        disabled={isUpdating || ticket.status === "in_progress"}
                                                        onClick={() => changeTicketStatus(ticket.id, "in_progress")}
                                                    >
                                                        В работу
                                                    </Button>
                                                    <Button
                                                        color="success"
                                                        variant="contained"
                                                        disabled={isUpdating || ticket.status === "completed"}
                                                        onClick={() => changeTicketStatus(ticket.id, "completed")}
                                                    >
                                                        Выполнено
                                                    </Button>
                                                </Stack>
                                            </Stack>

                                            <Stack
                                                direction={{ xs: "column", md: "row" }}
                                                spacing={2}
                                                alignItems={{ xs: "stretch", md: "flex-start" }}
                                            >
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    minRows={2}
                                                    label="Отчет о выполнении"
                                                    value={reportText}
                                                    onChange={(event) =>
                                                        setReportDrafts((current) => ({
                                                            ...current,
                                                            [ticket.id]: event.target.value
                                                        }))
                                                    }
                                                />
                                                <Button
                                                    sx={{ minWidth: 180 }}
                                                    variant="contained"
                                                    disabled={isUpdating || !reportText.trim()}
                                                    onClick={() => submitReport(ticket.id)}
                                                >
                                                    Сохранить отчет
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}

export default ExecutorTicketsPage;
