"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { statuses } from "@/lib/status";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const availableStatuses = ["tailoring", "tailored", "checking", "checked"];

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("tailoring");
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [assigningGroup, setAssigningGroup] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Track which submodel's dropdown is open to prevent UI updates
  const [openDropdown, setOpenDropdown] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/qualityControllerMaster/orders", {
        params: { status: selectedStatus },
      });
      setOrders(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Buyurtmalarni yuklab olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get("/qualityControllerMaster/groups");
      setGroups(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Grupmalarni yuklab olishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  const getStatusBadge = (status) => {
    const statusInfo = statuses[status];
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color} text-white`}
      >
        {statusInfo.text}
      </span>
    );
  };

  const handleGroupSelection = (order_sub_model_id, group_id) => {
    // Find the submodel and its current group info for the confirmation dialog
    let submodelInfo = null;
    let actionType = "add";

    for (const order of orders) {
      if (order.order_model?.submodels) {
        const foundSubmodel = order.order_model.submodels.find(
          (sm) => sm.id === order_sub_model_id
        );
        if (foundSubmodel) {
          submodelInfo = foundSubmodel;
          actionType = foundSubmodel.group ? "change" : "add";
          break;
        }
      }
    }

    // Convert "null" string to actual null
    const actualGroupId = group_id === "null" ? null : group_id;

    // Store the pending action
    setPendingAction({
      order_sub_model_id,
      group_id: actualGroupId,
      submodelInfo,
      actionType,
      isRemoval: group_id === "null",
    });

    // Close the dropdown
    setOpenDropdown(null);

    // Open the confirmation dialog
    setConfirmDialogOpen(true);
  };

  const assignGroupToSubmodel = async () => {
    if (!pendingAction) return;

    const { order_sub_model_id, group_id } = pendingAction;
    setAssigningGroup(order_sub_model_id);
    setConfirmDialogOpen(false);

    try {
      await api.post("/qualityControllerMaster/fasteningOrderToGroup/", {
        order_sub_model_id,
        group_id,
      });

      toast({
        title: "Muvaffaqiyatli",
        description: "Guruh muvaffaqiyatli biriktirildi",
        style: {
          backgroundColor: "green",
          color: "white",
        },
      });

      // Refresh orders to show updated data
      fetchOrders();
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          error.response?.data?.message ||
          "Guruhni biriktirish jarayonida xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setAssigningGroup(null);
      setPendingAction(null);
      setOpenDropdown(null);
    }
  };

  // Confirmation Dialog
  const getGroupName = (id) => {
    if (!id) return "Hech qanday guruh";
    const group = groups.find((g) => g.id.toString() === id.toString());
    return group ? group.name : "Tanlangan guruh";
  };

  // Handle dropdown open state
  const handleDropdownOpenChange = (open, submodelId) => {
    if (open) {
      setOpenDropdown(submodelId);
    } else if (openDropdown === submodelId) {
      setOpenDropdown(null);
    }
  };

  // Custom button to trigger group change
  const handleChangeGroupClick = (submodel) => {
    setOpenDropdown(submodel.id);
  };

  return (
    <div className="max-w-full px-4 py-6">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Buyurtmalar</h1>
        <div className="flex overflow-x-auto pb-2 hide-scrollbar">
          {availableStatuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap mr-2 ${
                selectedStatus === status
                  ? `${statuses[status].color} text-white`
                  : `bg-gray-100 text-gray-700 hover:bg-gray-200`
              }`}
            >
              {statuses[status].text}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-2 border-gray-300 border-t-blue-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {orders.map((order, index) => (
              <AccordionItem
                key={order.id}
                value={`order-${order.id}`}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } border-b`}
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline">
                  <div className="flex w-full justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">
                        #{order.id}
                      </span>
                      <span className="text-sm text-gray-700">
                        {order.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mr-4">
                      <span className="text-sm text-gray-700">
                        {order.order_model?.model?.name || "—"}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3">
                  <div className="grid grid-cols-1 gap-3 pb-2">
                    {order.order_model?.submodels?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Submodellar:
                        </h4>
                        <div className="flex flex-col gap-2">
                          {order.order_model.submodels.map((submodel) => (
                            <div
                              key={submodel.id}
                              className="flex items-center gap-2"
                            >
                              <div className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-md">
                                {submodel.submodel.name}
                                {submodel.group && ` (${submodel.group.name})`}
                              </div>

                              {groups.length > 0 && (
                                <div className="flex items-center gap-2">
                                  {submodel.group ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() =>
                                        handleChangeGroupClick(submodel)
                                      }
                                      disabled={assigningGroup === submodel.id}
                                    >
                                      {assigningGroup === submodel.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : null}
                                      Guruhni o'zgartirish
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() =>
                                        setOpenDropdown(submodel.id)
                                      }
                                      disabled={assigningGroup === submodel.id}
                                    >
                                      {assigningGroup === submodel.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : null}
                                      {submodel.group
                                        ? "Guruhni tanlash"
                                        : "Guruh tanlash"}
                                    </Button>
                                  )}

                                  {openDropdown === submodel.id && (
                                    <div className="relative">
                                      <Select
                                        open={openDropdown === submodel.id}
                                        onOpenChange={(open) =>
                                          handleDropdownOpenChange(
                                            open,
                                            submodel.id
                                          )
                                        }
                                        value={
                                          submodel.group?.id?.toString() || ""
                                        }
                                        onValueChange={(value) => {
                                          handleGroupSelection(
                                            submodel.id,
                                            value
                                          );
                                        }}
                                      >
                                        <SelectTrigger className="h-7 w-[180px]">
                                          <SelectValue
                                            placeholder={
                                              submodel.group
                                                ? submodel.group.name
                                                : "Guruh tanlang"
                                            }
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {submodel.group && (
                                            <SelectItem value="null">
                                              Guruhni o'chirish
                                            </SelectItem>
                                          )}
                                          {groups
                                            .sort((a, b) =>
                                              a.name.localeCompare(b.name)
                                            )
                                            .map((group) => (
                                              <SelectItem
                                                key={group.id}
                                                value={group.id.toString()}
                                              >
                                                {group.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.order_model?.sizes?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                          O'lchamlar:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {order.order_model.sizes.map((sizeItem) => (
                            <span
                              key={sizeItem.id}
                              className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-md"
                            >
                              {sizeItem.size.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.actionType === "add"
                ? "Guruh biriktirish"
                : "Guruhni o'zgartirish"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.submodelInfo?.submodel?.name} uchun{" "}
              {pendingAction?.isRemoval
                ? "guruh olib tashlansinmi"
                : pendingAction?.actionType === "add"
                ? "guruh biriktirilsinmi"
                : "guruh o'zgartirilsinmi"}
              ?
              {pendingAction?.actionType === "change" &&
                pendingAction?.submodelInfo?.group && (
                  <div className="mt-2">
                    <span className="font-medium">Joriy guruh:</span>{" "}
                    {pendingAction.submodelInfo.group.name}
                  </div>
                )}
              {pendingAction?.group_id && !pendingAction?.isRemoval && (
                <div className="mt-2">
                  <span className="font-medium">Yangi guruh:</span>{" "}
                  {getGroupName(pendingAction.group_id)}
                </div>
              )}
              {pendingAction?.isRemoval && (
                <div className="mt-2 text-rose-500 font-medium">
                  Bu amal guruhni o'chiradi!
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
              }}
            >
              Bekor qilish
            </Button>
            <Button onClick={assignGroupToSubmodel}>Tasdiqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
