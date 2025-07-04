import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, CreditCard, Wallet, Plus, Trash2, Calendar, 
  DollarSign, FileText, Sparkles 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contractFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid email required"),
  projectDescription: z.string().min(20, "Please provide a detailed description"),
  totalValue: z.string().min(1, "Total value is required"),
  paymentMethod: z.enum(["stripe", "usdc"]),
  contractType: z.enum(["fixed_price", "milestone_based"]),
  freelanceType: z.string().min(1, "Select your profession"),
  urgency: z.enum(["standard", "urgent", "rush"]),
  clientRequirements: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

const milestoneSchema = z.object({
  title: z.string().min(3, "Milestone title required"),
  description: z.string().min(10, "Description required"),
  amount: z.string().min(1, "Amount required"),
  dueDate: z.string().min(1, "Due date required"),
});

type MilestoneData = z.infer<typeof milestoneSchema>;

export default function CreateContract() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<string>("");
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      contractType: "milestone_based",
      paymentMethod: "stripe",
      freelanceType: "developer",
      urgency: "standard",
    }
  });

  const contractType = form.watch("contractType");

  const generateContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      // Simulate AI contract generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const contract = `
FREELANCE SERVICES AGREEMENT

This Agreement is entered into between ${data.clientName} ("Client") and [Freelancer Name] ("Service Provider").

PROJECT SCOPE:
${data.projectDescription}

PAYMENT TERMS:
- Total Project Value: $${data.totalValue}
- Payment Method: ${data.paymentMethod === "stripe" ? "Credit Card via Stripe" : "USDC Cryptocurrency"}
- Payment Structure: ${data.contractType === "milestone_based" ? "Milestone-based payments" : "Fixed price upon completion"}

DELIVERABLES:
${data.contractType === "milestone_based" 
  ? milestones.map((m, i) => `${i + 1}. ${m.title} - $${m.amount} (Due: ${m.dueDate})`).join('\n')
  : "Final deliverable upon project completion"
}

TERMS & CONDITIONS:
- All work shall be completed in a professional manner
- Client approval required for milestone completion
- Payments will be released automatically upon milestone approval
- Disputes will be handled through PayFlow's resolution system

Generated with AI assistance • Legally reviewed • Blockchain secured
      `.trim();
      
      return contract;
    },
    onSuccess: (contract) => {
      setGeneratedContract(contract);
      toast({
        title: "Contract Generated!",
        description: "Your AI-powered contract is ready for review and sending.",
      });
    }
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          creatorId: "user-123", // Mock user ID
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract Created!",
        description: "Your contract has been saved and is ready to send to your client.",
      });
      // Reset form or redirect
    }
  });

  const handleGenerateContract = async () => {
    const formData = form.getValues();
    setIsGenerating(true);
    await generateContractMutation.mutateAsync(formData);
    setIsGenerating(false);
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      title: "",
      description: "",
      amount: "",
      dueDate: "",
    }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneData, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const onSubmit = (data: ContractFormData) => {
    createContractMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">Create New Contract</h1>
            </div>
            <Badge variant="secondary" className="bg-violet-100 text-violet-800">
              <Sparkles className="w-4 h-4 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contract Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Details
                </CardTitle>
                <CardDescription>
                  Tell us about your project and we'll generate a professional contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Modern Website Redesign" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Client or Company Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="client@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="projectDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the project scope, requirements, and deliverables..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Be specific about what you'll deliver
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="totalValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Value ($)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="5000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="freelanceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Profession</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select profession" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="developer">Web Developer</SelectItem>
                                <SelectItem value="designer">UI/UX Designer</SelectItem>
                                <SelectItem value="writer">Content Writer</SelectItem>
                                <SelectItem value="consultant">Consultant</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Payment Structure</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="milestone_based" id="milestone" />
                                <label htmlFor="milestone" className="text-sm">
                                  Milestone-based (Recommended)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed_price" id="fixed" />
                                <label htmlFor="fixed" className="text-sm">
                                  Fixed price upon completion
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="stripe" id="stripe" />
                                <CreditCard className="w-4 h-4" />
                                <label htmlFor="stripe" className="text-sm">
                                  Credit Card (Stripe)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="usdc" id="usdc" />
                                <Wallet className="w-4 h-4" />
                                <label htmlFor="usdc" className="text-sm">
                                  USDC (Cryptocurrency)
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {contractType === "milestone_based" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Milestones</h3>
                          <Button type="button" variant="outline" onClick={addMilestone}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Milestone
                          </Button>
                        </div>
                        
                        {milestones.map((milestone, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Milestone {index + 1}</h4>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeMilestone(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input
                                placeholder="Milestone title"
                                value={milestone.title}
                                onChange={(e) => updateMilestone(index, "title", e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Amount ($)"
                                value={milestone.amount}
                                onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                              />
                              <Input
                                type="date"
                                value={milestone.dueDate}
                                onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                              />
                              <Textarea
                                placeholder="Description"
                                value={milestone.description}
                                onChange={(e) => updateMilestone(index, "description", e.target.value)}
                                className="md:col-span-1"
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGenerateContract}
                        disabled={isGenerating}
                        className="flex-1"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        {isGenerating ? "Generating..." : "Generate Contract"}
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={!generatedContract || createContractMutation.isPending}
                        className="flex-1"
                      >
                        {createContractMutation.isPending ? "Creating..." : "Create & Send"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Generated Contract Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contract Preview
                </CardTitle>
                <CardDescription>
                  AI-generated contract based on your project details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContract ? (
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {generatedContract}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Fill out the project details and click "Generate Contract" to see your AI-powered contract</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}