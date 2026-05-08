import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

const New = () => {
  const { toast } = useToast();

  const [warehouses, setWarehouses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sources, setSources] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const getData = async () => {
    try {
      const [
        warehousesRes,
        ordersRes,
        employeesRes,
        sourcesRes,
        departmentsRes,
        itemTypesRes,
        currenciesRes,
      ] = await Promise.all([
        api.get("/warehouseManager/warehouse"),
        api.get("/warehouseManager/order"),
        api.get("/warehouseManager/employee"),
        api.get("/warehouseManager/source"),
        api.get("/warehouseManager/department"),
        api.get("/warehouseManager/itemType"),
        api.get("/warehouseManager/currency"),
      ]);
      setWarehouses(warehousesRes.data);
      setOrders(ordersRes.data);
      setEmployees(employeesRes.data);
      setSources(sourcesRes.data);
      setDepartments(departmentsRes.data);
      setItemTypes(itemTypesRes.data);
      setCurrencies(currenciesRes.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni olib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return <div>New</div>;
};

export default New;
