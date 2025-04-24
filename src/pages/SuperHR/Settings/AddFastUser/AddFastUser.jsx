import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const AddFastUser = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [userNames, setUserNames] = useState("");
  const [groups, setGroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: [], failed: [] });
  const [showResults, setShowResults] = useState(false);

  // Fetch departments and positions on component mount
  useEffect(() => {
    fetchDepartments();
    fetchPositions();
  }, []);

  // Filter positions based on selected department
  useEffect(() => {
    if (selectedDepartment && positions.length > 0) {
      const filtered = positions.filter(
        (position) => position.department_id === parseInt(selectedDepartment)
      );
      setFilteredPositions(filtered);
    } else {
      setFilteredPositions([]);
    }
  }, [selectedDepartment, positions]);

  // Set groups when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const department = departments.find(
        (dept) => dept.id === parseInt(selectedDepartment)
      );

      // Find the department in main_departments
      const mainDepartment = departments
        .flatMap((dept) => dept.departments || [])
        .find((dept) => dept.id === parseInt(selectedDepartment));

      if (mainDepartment && mainDepartment.groups) {
        setGroups(mainDepartment.groups);
      } else {
        setGroups([]);
      }
    } else {
      setGroups([]);
    }

    // Reset group selection when department changes
    setSelectedGroup(null);
  }, [selectedDepartment, departments]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/superhr/departments");
      setDepartments(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Departamentlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await api.get("/superhr/positions");
      setPositions(response.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Lavozimlar olishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
  };

  const handleGroupChange = (value) => {
    setSelectedGroup(value);
  };

  const handlePositionChange = (value) => {
    setSelectedPosition(value);
  };

  const handleUserNamesChange = (e) => {
    setUserNames(e.target.value);
  };

  const processUsers = async () => {
    // Reset results
    setResults({ success: [], failed: [] });
    setShowResults(false);

    // Split user names by new line, comma, or semicolon
    const names = userNames
      .split(/[\n,;]+/)
      .map((name) => name.trim())
      .filter((name) => name !== "");

    if (names.length === 0) {
      toast({
        title: "Xatolik",
        description: "Foydalanuvchilar ro'yxati bo'sh",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDepartment) {
      toast({
        title: "Xatolik",
        description: "Bo'limni tanlang",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPosition) {
      toast({
        title: "Xatolik",
        description: "Lavozimni tanlang",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const successList = [];
    const failedList = [];

    for (let i = 0; i < names.length; i++) {
      const name = names[i];

      try {
        // Set progress
        const currentProgress = Math.floor((i / names.length) * 100);
        setProgress(currentProgress);

        // Prepare data
        const userData = {
          name,
          department_id: parseInt(selectedDepartment),
          position_id: parseInt(selectedPosition),
        };

        // Add group_id if selected
        if (selectedGroup) {
          userData.group_id = parseInt(selectedGroup);
        }

        // Send request
        await api.post("/superhr/employees/store", userData);

        successList.push(name);
      } catch (error) {
        failedList.push({
          name,
          error: error.response?.data?.message || "Noma'lum xatolik",
        });
      }
    }

    // Complete progress
    setProgress(100);

    // Save results
    setResults({
      success: successList,
      failed: failedList,
    });

    // Show summary toast
    toast({
      title: "Natija",
      description: `${successList.length} ta muvaffaqiyatli, ${failedList.length} ta xatolik`,
      variant: successList.length > 0 ? "default" : "destructive",
    });

    // Reset form if all successful
    if (failedList.length === 0) {
      setUserNames("");
    }

    setIsSubmitting(false);
    setShowResults(true);
  };

  // Flatten departments for selection
  const flattenedDepartments = departments.flatMap((mainDept) =>
    mainDept.departments
      ? [
          ...mainDept.departments.map((dept) => ({
            ...dept,
            main_name: mainDept.name,
          })),
        ]
      : []
  );

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Tezkor foydalanuvchi qo'shish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Department Selection */}
          <div className="grid gap-2">
            <Label htmlFor="department">Bo'limni tanlang *</Label>
            <Select
              value={selectedDepartment}
              onValueChange={handleDepartmentChange}
              disabled={isSubmitting}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {flattenedDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.main_name} - {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group Selection - Only visible if groups exist */}
          {groups.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="group">Guruhni tanlang (ixtiyoriy)</Label>
              <Select
                value={selectedGroup}
                onValueChange={handleGroupChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Guruhni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Position Selection */}
          <div className="grid gap-2">
            <Label htmlFor="position">Lavozimni tanlang *</Label>
            <Select
              value={selectedPosition}
              onValueChange={handlePositionChange}
              disabled={isSubmitting || !selectedDepartment}
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Lavozimni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {filteredPositions.map((position) => (
                  <SelectItem key={position.id} value={position.id.toString()}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Names Input */}
          <div className="grid gap-2">
            <Label htmlFor="users">
              Foydalanuvchilar ro'yxati (har bir qatorda bitta ism) *
            </Label>
            <Textarea
              id="users"
              placeholder="John Doe&#10;Jane Smith&#10;Alex Johnson"
              rows={6}
              value={userNames}
              onChange={handleUserNamesChange}
              disabled={isSubmitting}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Har bir qatorda bitta ism yoki vergul bilan ajrating
            </p>
          </div>

          {/* Progress Bar - Only visible during submission */}
          {isSubmitting && (
            <div className="grid gap-2">
              <Label>Yuborish jarayoni</Label>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                {progress}% tugallandi
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={processUsers}
            disabled={
              isSubmitting ||
              !selectedDepartment ||
              !selectedPosition ||
              !userNames.trim()
            }
            className="w-full"
          >
            {isSubmitting ? "Yuborilmoqda..." : "Foydalanuvchilarni qo'shish"}
          </Button>

          {/* Results Section */}
          {showResults && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold">Natijalar</h3>

              {/* Successful Users */}
              {results.success.length > 0 && (
                <Alert
                  variant="default"
                  className="bg-green-50 border-green-200"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    Muvaffaqiyatli qo'shilgan ({results.success.length})
                  </AlertTitle>
                  <AlertDescription className="max-h-40 overflow-y-auto mt-2">
                    <div className="grid grid-cols-2 gap-1">
                      {results.success.map((name, index) => (
                        <div
                          key={index}
                          className="text-sm text-green-600 flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {name}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Failed Users */}
              {results.failed.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Xatoliklar ({results.failed.length})</AlertTitle>
                  <AlertDescription className="max-h-40 overflow-y-auto mt-2">
                    <div className="space-y-1">
                      {results.failed.map((item, index) => (
                        <div
                          key={index}
                          className="text-sm flex items-start gap-1"
                        >
                          <AlertCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                          <span>
                            <strong>{item.name}</strong>: {item.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFastUser;
