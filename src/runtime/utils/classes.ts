type ClassValue = string | { [key: string]: ClassValue | null };

export default function <T extends ClassValue | Array<ClassValue>>(classes: T) {
    return classes;
}