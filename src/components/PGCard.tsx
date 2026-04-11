import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wifi, Utensils, Wind, Droplets } from "lucide-react";

interface Props {
  id: string;
  title: string;
  location: string;
  price: number;
  gender: string | null;
  vacancies: number | null;
  wifi: boolean | null;
  food: boolean | null;
  ac: boolean | null;
  water: boolean | null;
  imageUrl?: string;
}

export default function PGCard({ id, title, location, price, gender, vacancies, wifi, food, ac, water, imageUrl }: Props) {
  return (
    <Link to={`/pg/${id}`}>
      <Card className="overflow-hidden hover:shadow-glow transition-all duration-300 group">
        <div className="aspect-video bg-muted overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-display font-semibold text-lg truncate">{title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {location}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">₹{price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
            {gender && <Badge variant="secondary" className="capitalize">{gender}</Badge>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {wifi && <Badge variant="outline" className="gap-1 text-xs"><Wifi className="h-3 w-3" />WiFi</Badge>}
            {food && <Badge variant="outline" className="gap-1 text-xs"><Utensils className="h-3 w-3" />Food</Badge>}
            {ac && <Badge variant="outline" className="gap-1 text-xs"><Wind className="h-3 w-3" />AC</Badge>}
            {water && <Badge variant="outline" className="gap-1 text-xs"><Droplets className="h-3 w-3" />Water</Badge>}
          </div>
          {vacancies !== null && vacancies > 0 && (
            <p className="text-xs text-success font-medium">{vacancies} vacancies available</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}