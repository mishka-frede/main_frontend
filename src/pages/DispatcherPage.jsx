import {
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
    Collapse,
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


function formatAddress(address) {

    return `${address.street}, д. ${address.house}, п. ${address.entrance || "-"}, кв. ${address.apartment}`;
}


function DispatcherPage() {

    const [tickets, setTickets] =
        useState([]);

    const [pendingAddresses, setPendingAddresses] =
        useState([]);

    const [executors, setExecutors] =
        useState([]);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [expandedTicketId, setExpandedTicketId] =
        useState(null);

    const [subscribers, setSubscribers] =
        useState([]);

    const [mergeDialogOpen, setMergeDialogOpen] =
        useState(false);

    const [mergePrimaryId, setMergePrimaryId] =
        useState("");

    const [mergeSecondaryId, setMergeSecondaryId] =
        useState("");

    const [mergeReason, setMergeReason] =
        useState("");

    const [disputedTickets, setDisputedTickets] =
        useState([]);

    const [resolveDialogOpen, setResolveDialogOpen] =
        useState(false);

    const [resolveTicketId, setResolveTicketId] =
        useState(null);

    const [resolveComment, setResolveComment] =
        useState("");

    const [resolveStatus, setResolveStatus] =
        useState("in_progress");

    useEffect(() => {
        fetchTickets();
        fetchPendingAddresses();
        fetchDisputedTickets();
        fetchExecutors();
    }, []);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    });

    const fetchTickets = async () => {

        try {

            const response = await api.get(
                "/tickets/all",
                {
                    headers: getAuthHeaders()
                }
            );

            setTickets(response.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить заявки. Проверьте права диспетчера.");
        }
    };

    const fetchDisputedTickets = async () => {

        try {

            const response = await api.get(
                "/tickets/disputed",
                { headers: getAuthHeaders() }
            );

            setDisputedTickets(response.data);

        } catch (err) {
            console.error(err);
        }
    };

    const fetchExecutors = async () => {

        try {

            const response = await api.get(
                "/users/executors",
                { headers: getAuthHeaders() }
            );

            setExecutors(response.data);

        } catch (err) {
            console.error(err);
        }
    };

    const openResolveDialog = (ticketId) => {

        setResolveTicketId(ticketId);
        setResolveComment("");
        setResolveStatus("in_progress");
        setResolveDialogOpen(true);
    };

    const resolveDispute = async () => {

        if (!resolveComment.trim()) {
            setError("Укажите комментарий к решению.");
            return;
        }

        try {

            await api.patch(
                `/tickets/${resolveTicketId}/dispute/resolve`,
                {
                    resolution_comment: resolveComment,
                    new_status: resolveStatus
                },
                { headers: getAuthHeaders() }
            );

            setResolveDialogOpen(false);
            setMessage("Оспаривание обработано.");
            fetchTickets();
            fetchDisputedTickets();

        } catch (err) {
            console.error(err);
            setError("Не удалось закрыть оспаривание.");
        }
    };

    const fetchPendingAddresses = async () => {

        try {

            const response = await api.get(
                "/addresses/pending",
                {
                    headers: getAuthHeaders()
                }
            );

            setPendingAddresses(response.data);

        } catch (err) {
            console.error(err);
        }
    };

    const verifyAddress = async (addressLinkId) => {

        setError("");
        setMessage("");

        try {

            await api.patch(
                `/addresses/${addressLinkId}/verify`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );

            setMessage("Адрес подтвержден.");
            fetchPendingAddresses();

        } catch (err) {
            console.error(err);
            setError("Не удалось подтвердить адрес.");
        }
    };

    const updateStatus = async (ticketId, newStatus) => {

        try {

            await api.patch(
                `/tickets/${ticketId}/status?new_status=${newStatus}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );

            fetchTickets();

        } catch (err) {
            console.error(err);
            setError("Не удалось обновить статус заявки.");
        }
    };

    const assignExecutor = async (ticketId, executorId) => {

        setError("");
        setMessage("");

        try {

            await api.patch(
                `/tickets/${ticketId}/executor`,
                {
                    executor_id: executorId ? Number(executorId) : null
                },
                {
                    headers: getAuthHeaders()
                }
            );

            setMessage("Исполнитель обновлен.");
            fetchTickets();

        } catch (err) {
            console.error(err);
            setError("Не удалось назначить исполнителя.");
        }
    };

    const fetchSubscribers = async (ticketId) => {

        const response = await api.get(
            `/tickets/${ticketId}/subscribers`,
            {
                headers: getAuthHeaders()
            }
        );

        setSubscribers(response.data);
    };

    const toggleSubscribers = async (ticketId) => {

        if (expandedTicketId === ticketId) {
            setExpandedTicketId(null);
            return;
        }

        try {

            await fetchSubscribers(ticketId);
            setExpandedTicketId(ticketId);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить подписчиков.");
        }
    };

    const unlinkSubscriber = async (ticketId, linkId) => {

        try {

            await api.delete(
                `/tickets/${ticketId}/subscribers/${linkId}`,
                {
                    headers: getAuthHeaders()
                }
            );

            setMessage("Подписчик отвязан.");
            await fetchSubscribers(ticketId);
            fetchTickets();

        } catch (err) {
            console.error(err);
            setError("Не удалось отвязать подписчика.");
        }
    };

    const mergeTickets = async () => {

        setError("");
        setMessage("");

        try {

            await api.post(
                "/tickets/merge",
                {
                    primary_ticket_id: Number(mergePrimaryId),
                    secondary_ticket_id: Number(mergeSecondaryId),
                    reason: mergeReason.trim() || null
                },
                {
                    headers: getAuthHeaders()
                }
            );

            setMergeDialogOpen(false);
            setMergePrimaryId("");
            setMergeSecondaryId("");
            setMergeReason("");
            setMessage("Заявки объединены.");
            fetchTickets();

        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === "string"
                    ? detail
                    : "Не удалось объединить заявки."
            );
        }
    };

    return (

        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                Панель диспетчера
                            </Typography>
                            <Typography color="text.secondary">
                                Обрабатывайте заявки, подписчиков и объединение обращений.
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            onClick={() => setMergeDialogOpen(true)}
                        >
                            Объединить заявки
                        </Button>
                    </Stack>

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

                    {disputedTickets.length > 0 && (
                        <Card sx={{ borderColor: "warning.main", borderWidth: 1, borderStyle: "solid" }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h5" color="warning.main">
                                        Проблемные обращения (оспаривания)
                                    </Typography>

                                    {disputedTickets.map((ticket) => (
                                        <Card key={ticket.id} variant="outlined">
                                            <CardContent>
                                                <Stack
                                                    direction={{ xs: "column", md: "row" }}
                                                    spacing={2}
                                                    justifyContent="space-between"
                                                >
                                                    <Box>
                                                        <Typography variant="h6">
                                                            Заявка #{ticket.id}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            {ticket.description}
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction="row" spacing={1}>
                                                        <Button
                                                            component={Link}
                                                            to={`/tickets/${ticket.id}`}
                                                            variant="outlined"
                                                        >
                                                            Открыть
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            color="warning"
                                                            onClick={() =>
                                                                openResolveDialog(ticket.id)
                                                            }
                                                        >
                                                            Обработать
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h5">
                                    Адреса на подтверждение
                                </Typography>

                                {pendingAddresses.length === 0 && (
                                    <Typography color="text.secondary">
                                        Неподтвержденных адресов нет.
                                    </Typography>
                                )}

                                {pendingAddresses.map((address) => (
                                    <Card key={address.id}>
                                        <CardContent>
                                            <Stack
                                                direction={{ xs: "column", md: "row" }}
                                                spacing={2}
                                                justifyContent="space-between"
                                            >
                                                <Box>
                                                    <Typography variant="h6">
                                                        {formatAddress(address)}
                                                    </Typography>
                                                    <Typography color="text.secondary">
                                                        Лицевой счет: {address.personal_account}
                                                    </Typography>
                                                    <Typography color="text.secondary">
                                                        Пользователь: {address.user?.full_name} ({address.user?.email})
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    onClick={() => verifyAddress(address.id)}
                                                >
                                                    Подтвердить
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Stack spacing={2}>
                        {tickets.length === 0 && !error && (
                            <Card>
                                <CardContent sx={{ py: 5, textAlign: "center" }}>
                                    <Typography variant="h6" gutterBottom>
                                        Активных заявок нет
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        {tickets.map((ticket) => (
                            <Card key={ticket.id}>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2}
                                            justifyContent="space-between"
                                        >
                                            <Stack spacing={1.5}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    sx={{ flexWrap: "wrap", rowGap: 1 }}
                                                >
                                                    <Typography variant="h6">
                                                        Заявка #{ticket.id}
                                                    </Typography>
                                                    <Chip
                                                        label={statusLabels[ticket.status] || ticket.status}
                                                        color={statusColors[ticket.status] || "default"}
                                                    />
                                                    <Chip
                                                        label={`Приоритет: ${ticket.priority}`}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label={`Подписчиков: ${ticket.subscribers_count || 0}`}
                                                        color="info"
                                                        variant="outlined"
                                                    />
                                                </Stack>

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
                                                        ? formatAddress(ticket.address)
                                                        : "не указан"}
                                                </Typography>

                                                <FormControl size="small" sx={{ maxWidth: 320 }}>
                                                    <InputLabel>Исполнитель</InputLabel>
                                                    <Select
                                                        label="Исполнитель"
                                                        value={ticket.assigned_executor_id || ""}
                                                        onChange={(event) =>
                                                            assignExecutor(
                                                                ticket.id,
                                                                event.target.value
                                                            )
                                                        }
                                                    >
                                                        <MenuItem value="">
                                                            Не назначен
                                                        </MenuItem>
                                                        {executors.map((executor) => (
                                                            <MenuItem
                                                                key={executor.id}
                                                                value={executor.id}
                                                            >
                                                                {executor.full_name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Stack>

                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={1}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    disabled={ticket.status === "in_progress"}
                                                    onClick={() => updateStatus(ticket.id, "in_progress")}
                                                >
                                                    В работу
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    disabled={ticket.status === "completed"}
                                                    onClick={() => updateStatus(ticket.id, "completed")}
                                                >
                                                    Завершить
                                                </Button>

                                                <Button
                                                    variant="text"
                                                    onClick={() => toggleSubscribers(ticket.id)}
                                                >
                                                    Подписчики
                                                </Button>
                                            </Stack>
                                        </Stack>

                                        <Collapse in={expandedTicketId === ticket.id}>
                                            <Stack spacing={1}>
                                                {subscribers.map((subscriber) => (
                                                    <Card key={subscriber.id} variant="outlined">
                                                        <CardContent>
                                                            <Stack
                                                                direction={{ xs: "column", sm: "row" }}
                                                                justifyContent="space-between"
                                                                spacing={1}
                                                            >
                                                                <Box>
                                                                    <Typography>
                                                                        {subscriber.full_name}
                                                                        {subscriber.is_creator && " (создатель)"}
                                                                    </Typography>
                                                                    {subscriber.email && (
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {subscriber.email}
                                                                        </Typography>
                                                                    )}
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Присоединился: {new Date(subscriber.joined_at).toLocaleString("ru-RU")}
                                                                    </Typography>
                                                                </Box>

                                                                {!subscriber.is_creator && (
                                                                    <Button
                                                                        color="warning"
                                                                        size="small"
                                                                        onClick={() =>
                                                                            unlinkSubscriber(
                                                                                ticket.id,
                                                                                subscriber.id
                                                                            )
                                                                        }
                                                                    >
                                                                        Отвязать
                                                                    </Button>
                                                                )}
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </Stack>
                                        </Collapse>

                                        {ticket.merge_history?.length > 0 && (
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Stack spacing={1}>
                                                        <Typography variant="subtitle2">
                                                            История объединений
                                                        </Typography>
                                                        {ticket.merge_history.map((entry) => (
                                                            <Box key={entry.id}>
                                                                <Typography variant="body2">
                                                                    Заявка #{entry.secondary_ticket_id} объединена с этой заявкой
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {entry.merged_by_name || `Пользователь #${entry.merged_by_user_id}`}
                                                                    {" · "}
                                                                    {new Date(entry.created_at).toLocaleString("ru-RU")}
                                                                </Typography>
                                                                {entry.reason && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Причина: {entry.reason}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Stack>
            </Container>

            <Dialog
                open={resolveDialogOpen}
                onClose={() => setResolveDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Обработка оспаривания #{resolveTicketId}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Новый статус заявки</InputLabel>
                            <Select
                                label="Новый статус заявки"
                                value={resolveStatus}
                                onChange={(e) => setResolveStatus(e.target.value)}
                            >
                                <MenuItem value="in_progress">В работу (повторное выполнение)</MenuItem>
                                <MenuItem value="completed">Выполнена</MenuItem>
                                <MenuItem value="closed">Закрыта</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Комментарий диспетчера"
                            value={resolveComment}
                            onChange={(e) => setResolveComment(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResolveDialogOpen(false)}>
                        Отмена
                    </Button>
                    <Button variant="contained" onClick={resolveDispute}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={mergeDialogOpen}
                onClose={() => setMergeDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Объединение заявок
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography color="text.secondary">
                            Основная заявка сохранится, вторая будет архивирована.
                            Категории должны совпадать.
                        </Typography>

                        <FormControl fullWidth>
                            <InputLabel>Основная заявка</InputLabel>
                            <Select
                                label="Основная заявка"
                                value={mergePrimaryId}
                                onChange={(e) => setMergePrimaryId(e.target.value)}
                            >
                                {tickets.map((ticket) => (
                                    <MenuItem key={ticket.id} value={ticket.id}>
                                        #{ticket.id} — {ticket.description.slice(0, 40)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Вторичная заявка</InputLabel>
                            <Select
                                label="Вторичная заявка"
                                value={mergeSecondaryId}
                                onChange={(e) => setMergeSecondaryId(e.target.value)}
                            >
                                {tickets.map((ticket) => (
                                    <MenuItem key={ticket.id} value={ticket.id}>
                                        #{ticket.id} — {ticket.description.slice(0, 40)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Причина объединения"
                            value={mergeReason}
                            onChange={(event) =>
                                setMergeReason(event.target.value)
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMergeDialogOpen(false)}>
                        Отмена
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!mergePrimaryId || !mergeSecondaryId}
                        onClick={mergeTickets}
                    >
                        Объединить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default DispatcherPage;
