import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Graphic Designer",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b882?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    quote: "I used to wait 30-60 days for payments. Now I get paid the same day my work is approved. PayFlow has completely changed my cash flow."
  },
  {
    name: "Marcus Rodriguez",
    role: "Web Developer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    quote: "The AI contract generation is incredible. It creates professional contracts that protect me legally while being easy for clients to understand."
  },
  {
    name: "Emma Thompson",
    role: "Marketing Consultant",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    quote: "My clients love the transparency. They can see exactly what they're paying for and when. It's made my client relationships so much smoother."
  },
  {
    name: "David Kim",
    role: "Photographer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    quote: "The escrow protection gives me confidence to work with new clients. I know I'll get paid even if there are disagreements."
  },
  {
    name: "Lisa Wang",
    role: "UX Designer",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    quote: "I've increased my rates by 40% because clients trust the platform and the professional contracts. It's elevated my entire business."
  },
  {
    name: "James Wilson",
    role: "Copywriter",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
    quote: "The analytics help me understand which types of projects are most profitable. I can make better business decisions now."
  }
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Freelancers Love PayFlow
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Join thousands of freelancers who've transformed their payment experience
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, starIndex) => (
                  <Star key={starIndex} className="w-5 h-5 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-6">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
